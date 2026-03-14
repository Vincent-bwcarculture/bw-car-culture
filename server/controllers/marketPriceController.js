// server/controllers/marketPriceController.js
import MarketPrice from '../models/MarketPrice.js';
import Listing from '../models/Listing.js';
import { ErrorResponse } from '../utils/errorResponse.js';
import asyncHandler from '../middleware/async.js';

// ─────────────────────────────────────────────
// @desc    Get market prices with filtering & pagination
// @route   GET /api/market-prices
// @access  Public
// ─────────────────────────────────────────────
export const getMarketPrices = asyncHandler(async (req, res) => {
  const {
    make,
    model,
    year,
    condition,
    minPrice,
    maxPrice,
    page = 1,
    limit = 20,
    sort = '-recordedDate'
  } = req.query;

  const filter = {};
  if (make)      filter.make      = { $regex: new RegExp(make, 'i') };
  if (model)     filter.model     = { $regex: new RegExp(model, 'i') };
  if (year)      filter.year      = Number(year);
  if (condition) filter.condition = condition;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip     = (pageNum - 1) * limitNum;

  // Build sort object from comma-separated string e.g. "-price,year"
  const sortObj = {};
  String(sort).split(',').forEach(s => {
    const dir = s.startsWith('-') ? -1 : 1;
    const key = s.replace(/^-/, '');
    sortObj[key] = dir;
  });

  const [data, total] = await Promise.all([
    MarketPrice.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
    MarketPrice.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limitNum);

  res.status(200).json({
    success: true,
    data,
    pagination: {
      currentPage: pageNum,
      totalPages,
      total,
      limit: limitNum,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    }
  });
});

// ─────────────────────────────────────────────
// @desc    Get distinct filter values for dropdowns
// @route   GET /api/market-prices/filters
// @access  Public
// ─────────────────────────────────────────────
export const getMarketFilters = asyncHandler(async (req, res) => {
  const [makes, models, years, conditions] = await Promise.all([
    MarketPrice.distinct('make'),
    MarketPrice.distinct('model'),
    MarketPrice.distinct('year'),
    MarketPrice.distinct('condition')
  ]);

  res.status(200).json({
    success: true,
    data: {
      makes:      makes.sort(),
      models:     models.sort(),
      years:      years.sort((a, b) => b - a),
      conditions: conditions.sort()
    }
  });
});

// ─────────────────────────────────────────────
// @desc    Get a single market price entry
// @route   GET /api/market-prices/:id
// @access  Public
// ─────────────────────────────────────────────
export const getMarketPrice = asyncHandler(async (req, res, next) => {
  const entry = await MarketPrice.findById(req.params.id).lean();
  if (!entry) return next(new ErrorResponse('Market price entry not found', 404));

  res.status(200).json({ success: true, data: entry });
});

// ─────────────────────────────────────────────
// @desc    Create a market price entry
// @route   POST /api/market-prices
// @access  Private/Admin
// ─────────────────────────────────────────────
export const createMarketPrice = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user.id;
  const entry = await MarketPrice.create(req.body);

  res.status(201).json({ success: true, data: entry });
});

// ─────────────────────────────────────────────
// @desc    Update a market price entry
// @route   PUT /api/market-prices/:id
// @access  Private/Admin
// ─────────────────────────────────────────────
export const updateMarketPrice = asyncHandler(async (req, res, next) => {
  const entry = await MarketPrice.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!entry) return next(new ErrorResponse('Market price entry not found', 404));

  res.status(200).json({ success: true, data: entry });
});

// ─────────────────────────────────────────────
// @desc    Delete a market price entry
// @route   DELETE /api/market-prices/:id
// @access  Private/Admin
// ─────────────────────────────────────────────
export const deleteMarketPrice = asyncHandler(async (req, res, next) => {
  const entry = await MarketPrice.findByIdAndDelete(req.params.id);
  if (!entry) return next(new ErrorResponse('Market price entry not found', 404));

  res.status(200).json({ success: true, message: 'Market price entry deleted' });
});

// ─────────────────────────────────────────────
// @desc    Batch import market price entries (array)
// @route   POST /api/market-prices/batch
// @access  Private/Admin
// ─────────────────────────────────────────────
export const batchImportMarketPrices = asyncHandler(async (req, res, next) => {
  const { entries } = req.body;

  if (!Array.isArray(entries) || entries.length === 0) {
    return next(new ErrorResponse('entries must be a non-empty array', 400));
  }

  if (entries.length > 500) {
    return next(new ErrorResponse('Maximum 500 entries per batch', 400));
  }

  const stamped = entries.map(e => ({ ...e, createdBy: req.user.id }));
  const result  = await MarketPrice.insertMany(stamped, { ordered: false });

  res.status(201).json({
    success: true,
    inserted: result.length,
    data: result
  });
});

// ─────────────────────────────────────────────
// @desc    Backfill market prices from all existing listings
// @route   POST /api/market-prices/sync-listings
// @access  Private/Admin
// ─────────────────────────────────────────────
export const syncFromListings = asyncHandler(async (req, res) => {
  // Fetch all listings that have the minimum required fields
  const listings = await Listing.find({
    'specifications.make': { $exists: true, $ne: '' },
    price: { $exists: true, $gt: 0 }
  }).lean();

  let synced = 0;
  let skipped = 0;

  for (const listing of listings) {
    try {
      const make  = listing.specifications?.make;
      const price = listing.price;
      if (!make || !price) { skipped++; continue; }

      const location = [listing.location?.city, listing.location?.country]
        .filter(Boolean).join(', ');

      // Determine lifecycle status from the listing's own status
      let listingStatus = 'active';
      if (listing.status === 'sold')     listingStatus = 'sold';
      if (listing.status === 'archived') listingStatus = 'archived';

      await MarketPrice.findOneAndUpdate(
        { listingId: listing._id },
        {
          make:          make,
          model:         listing.specifications?.model || '',
          year:          listing.specifications?.year,
          condition:     listing.condition || 'used',
          price:         price,
          mileage:       listing.specifications?.mileage ?? null,
          location,
          recordedDate:  listing.createdAt || Date.now(),
          source:        'listing',
          notes:         listing.title || '',
          createdBy:     req.user.id,
          listingId:     listing._id,
          listingStatus,
          soldAt:        listingStatus === 'sold' ? (listing.updatedAt || Date.now()) : null
        },
        { upsert: true, new: true, runValidators: true }
      );
      synced++;
    } catch (err) {
      console.error(`syncFromListings: skipping listing ${listing._id}:`, err.message);
      skipped++;
    }
  }

  res.status(200).json({
    success: true,
    synced,
    skipped,
    total: listings.length
  });
});
