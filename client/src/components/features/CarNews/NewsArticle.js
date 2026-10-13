// src/components/features/CarNews/NewsArticle.js
// COMPLETE FIXED VERSION - All API endpoints corrected to include /api prefix
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Share2, Heart, Clock, Calendar, Tag, ChevronLeft, ChevronRight, Camera, Eye, Bookmark, BookmarkCheck, Image, ArrowRight, MessageSquare, ThumbsUp, CornerDownRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.js';
import { http } from '../../../config/axios.js';
import { useNews } from '../../../context/NewsContext.js';
import VehicleCard from '../../shared/VehicleCard/VehicleCard.js';
import LoadingScreen from '../../shared/LoadingScreen/LoadingScreen.js';
import NewsGallery from './NewsGallery.js';
import FeaturedNews from './FeaturedNews.js';
import VideoSection from '../VideoSection/VideoSection.js';
import { getNewsImageUrl, getGalleryImageUrls, formatNewsImagePath, handleNewsImageError, getArticleIdentifier, formatDate, getAuthorInfo } from '../../../utils/newsHelpers.js';
import { buildHelmet, SITE_URL } from '../../../hooks/useSEO.js';
import { articleVehicle, relevantVehicles, relatedNews, newsVisitorId } from '../../../utils/newsDiscovery.js';
import StickyCarBar from '../../shared/StickyCarBar/StickyCarBar.js';
import './NewsArticle.css';

const NewsArticle = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { getRelatedItems, isItemSaved, toggleSaveItem, isItemViewed } = useNews();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [relatedVehicles, setRelatedVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('articles');
  const [galleryImages, setGalleryImages] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0);
  const [moreNewsItems, setMoreNewsItems] = useState([]);
  const [featuredVehicles, setFeaturedVehicles] = useState([]);
  const [isFeaturedVehiclesLoading, setIsFeaturedVehiclesLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // commentId
  const [replyText, setReplyText] = useState('');
  const [likedComments, setLikedComments] = useState({}); // commentId -> bool
  const { user } = useAuth();
  
  // Refs to prevent reprocessing
  const galleryProcessedRef = useRef(false);
  const articleFetchedRef = useRef(false);
  const initialFetchCompleteRef = useRef(false);

  // Helper function to clean HTML content
  const cleanHtmlContent = (content) => {
    if (!content) return '';
    
    // Remove HTML tags
    let cleaned = content.replace(/<[^>]*>?/gm, '');
    
    // Decode HTML entities
    cleaned = cleaned.replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#039;/g, "'")
                    .replace(/&nbsp;/g, ' ');
    
    return cleaned;
  };

  // Helper function to parse content - preserves HTML for rich rendering
  const parseArticleContent = (content) => {
    if (!content) return '';

    // If content is a JSON string (from some editors)
    if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
      try {
        const parsed = JSON.parse(content);
        // If it's an object with blocks (Draft.js / EditorJS format)
        if (parsed.blocks) {
          return parsed.blocks.map(block => `<p>${block.text || ''}</p>`).join('');
        }
        // If it's a simple object with an HTML content property
        if (parsed.content) {
          return parsed.content;
        }
        // Fallback: join values as paragraphs
        return Object.values(parsed).map(v => `<p>${v}</p>`).join('');
      } catch (e) {
        // JSON parsing failed — treat as raw HTML/text
        return content;
      }
    }

    // Already an HTML string — return as-is
    return content;
  };

  // Helper function to handle S3 image URLs
  const handleImageUrl = (imageData) => {
    if (!imageData) return '/images/placeholders/default.jpg';
    
    // If it's already a full URL (S3), return as is
    if (typeof imageData === 'string' && (imageData.startsWith('http://') || imageData.startsWith('https://'))) {
      return imageData;
    }
    
    // If it's an object with URL property
    if (imageData.url) {
      return imageData.url;
    }
    
    // If it's a legacy local path
    if (typeof imageData === 'string') {
      // Server should redirect these to S3
      return imageData.startsWith('/') ? imageData : `/${imageData}`;
    }
    
    return '/images/placeholders/default.jpg';
  };

  const loadRelatedContent = useCallback(async (currentArticle, isCurrent) => {
    const vehicle = articleVehicle(currentArticle);
    setIsFeaturedVehiclesLoading(!!vehicle.make);
    const loadNews = async () => {
      try {
        const category = encodeURIComponent(currentArticle.category || 'news');
        const requests = [`/api/news?status=published&category=${category}&limit=20`, '/api/news?status=published&limit=6'];
        if (vehicle.make) requests.push(`/api/news?status=published&search=${encodeURIComponent(vehicle.make === 'Mercedes-Benz' ? 'Mercedes' : vehicle.make)}&limit=20`);
        const results = await Promise.allSettled(requests.map(url => http.get(url)));
        if (!isCurrent()) return;
        const articles = [...new Map(results.flatMap(result => result.status === 'fulfilled' && Array.isArray(result.value.data?.data) ? result.value.data.data : []).map(item => [String(item._id || item.id), item])).values()];
        setRelatedArticles(relatedNews(currentArticle, articles));
        setMoreNewsItems(articles.filter(item => String(item._id || item.id) !== String(currentArticle._id || currentArticle.id)).slice(0, 3));
      } catch { if (isCurrent()) { setRelatedArticles([]); setMoreNewsItems([]); } }
    };
    const loadVehicles = async () => {
      try {
        if (!vehicle.make) return;
        const names = vehicle.make === 'Mercedes-Benz' ? ['Mercedes-Benz', 'Mercedes'] : vehicle.make === 'Volkswagen' ? ['Volkswagen', 'VW'] : [vehicle.make];
        const responses = await Promise.allSettled(names.map(make => http.get(`/api/listings?make=${encodeURIComponent(make)}&status=active,published&limit=30&sort=-createdAt`)));
        if (!isCurrent()) return;
        const unique = [...new Map(responses.flatMap(result => result.status === 'fulfilled' && Array.isArray(result.value.data?.data) ? result.value.data.data : []).map(item => [String(item._id || item.id), item])).values()];
        const relevant = relevantVehicles(unique, vehicle);
        setRelatedVehicles(relevant.slice(0, 3)); setFeaturedVehicles(relevant.slice(0, 6));
      } finally { if (isCurrent()) setIsFeaturedVehiclesLoading(false); }
    };
    await Promise.allSettled([loadNews(), loadVehicles()]);
  }, []);

  // Fetch the article data and related content
  useEffect(() => {
    // Skip if we already fetched this article
    if (articleFetchedRef.current && articleId === articleFetchedRef.current) {
      return;
    }
    
    let cancelled = false;
    const fetchArticleAndRelated = async () => {
      try {
        console.log(`Fetching article: ${articleId}`);
        setIsLoading(true);
        setError(null);
        
        // Clear previous article data
        setArticle(null);
        setGalleryImages([]);
        setSelectedGalleryIndex(0); setShowGallery(false);
        setComments([]); setShowComments(false); setRelatedArticles([]); setRelatedVehicles([]); setFeaturedVehicles([]); setMoreNewsItems([]);
        initialFetchCompleteRef.current = false;
        galleryProcessedRef.current = false;
        
        // FIXED: Added /api prefix - THIS WAS THE MAIN ISSUE!
        // Try to fetch the article - backend will handle both ID and slug
        const response = await http.get(`/api/news/${encodeURIComponent(articleId)}`);
        if (cancelled) return;
        
        if (response.data?.data) {
          // Store article ID to prevent duplicate fetches
          articleFetchedRef.current = articleId;
          
          const fetchedArticle = response.data.data;
          
          // Parse and clean the content
          const cleanedContent = parseArticleContent(fetchedArticle.content);
          fetchedArticle.parsedContent = cleanedContent;
          
          setArticle(fetchedArticle);
          setGalleryImages(getGalleryImageUrls(fetchedArticle));
          setIsLoading(false);

          loadRelatedContent(fetchedArticle, () => !cancelled);
          try {
            const likes = JSON.parse(localStorage.getItem('likedArticles') || '{}');
            setLiked(!!(likes[fetchedArticle._id] || likes[articleId]));
          } catch { setLiked(false); }
          try {
            const visitorId = newsVisitorId();
            http.post(`/api/news/${fetchedArticle._id}/engagement`, { action: 'view', visitorId }).then(result => {
              if (!cancelled && result.data?.data?.metadata) setArticle(value => ({ ...value, metadata: { ...value.metadata, views: Math.max(value.metadata?.views || 0, result.data.data.metadata.views || 0) } }));
            }).catch(() => {});
          } catch { /* Storage restrictions never prevent reading the article. */ }

          // Fetch comments from API
          try {
            const cRes = await http.get(`/api/comments/${fetchedArticle._id}`);
            if (cancelled) return;
            const apiComments = Array.isArray(cRes.data?.data) ? cRes.data.data : [];
            setComments(apiComments);
            if (apiComments.length > 0) setShowComments(true);
            // Seed liked state from localStorage for optimistic UI
            try {
              const lc = JSON.parse(localStorage.getItem('likedComments') || '{}');
              setLikedComments(lc);
            } catch (_) {}
          } catch (_) { if (!cancelled) setComments([]); }
          if (cancelled) return;



          initialFetchCompleteRef.current = true;
        } else {
          setError('Article not found');
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error fetching article:', error);
        // More detailed error logging
        if (error.status === 404 || error.response?.status === 404) {
          setError('Article not found. It may have been removed or the link is incorrect.');
        } else {
          setError('Failed to load article. Please try again later.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
  
    fetchArticleAndRelated();
    
    // Reset processing flags when article ID changes
    return () => {
      cancelled = true;
      if (articleId !== articleFetchedRef.current) {
        galleryProcessedRef.current = false;
        initialFetchCompleteRef.current = false;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  const [engagementLoading, setEngagementLoading] = useState(false);
  const handleShare = useCallback(async () => {
    if (!article) return;
    try {
      const url = `${SITE_URL}/news/article/${getArticleIdentifier(article)}`;
      if (navigator.share) await navigator.share({ title: article.title, text: article.subtitle || '', url });
      else { await navigator.clipboard.writeText(url); alert('Link copied to clipboard!'); }
      const result = await http.post(`/api/news/${article._id}/engagement`, { action: 'share', visitorId: newsVisitorId() });
      if (articleFetchedRef.current === articleId && result.data?.data?.metadata) setArticle(value => ({ ...value, metadata: { ...value.metadata, shares: result.data.data.metadata.shares } }));
    } catch { /* Cancelled or failed shares are not counted. */ }
  }, [article, articleId]);

  const handleLike = useCallback(async () => {
    if (!article || engagementLoading) return;
    setEngagementLoading(true);
    try {
      const next = !liked;
      const result = await http.post(`/api/news/${article._id}/engagement`, { action: 'like', liked: next, visitorId: newsVisitorId() });
      if (articleFetchedRef.current !== articleId || !result.data?.success) return;
      setLiked(next);
      setArticle(value => ({ ...value, metadata: { ...value.metadata, likes: result.data.data.metadata.likes } }));
      const likes = JSON.parse(localStorage.getItem('likedArticles') || '{}');
      delete likes[articleId];
      if (next) likes[article._id] = true; else delete likes[article._id];
      localStorage.setItem('likedArticles', JSON.stringify(likes));
    } catch { /* Keep the last confirmed state if the request fails. */ }
    finally { setEngagementLoading(false); }
  }, [article, articleId, liked, engagementLoading]);

  // Function to handle saving/bookmarking an article
  const handleSave = useCallback(() => {
    if (article) {
      toggleSaveItem(article);
    }
  }, [article, toggleSaveItem]);

  // Submit a new top-level comment
  const handleCommentSubmit = useCallback(async () => {
    if (!commentText.trim() || !article) return;
    setCommentLoading(true);
    try {
      const res = await http.post(`/api/comments/${article._id}`, {
        text: commentText.trim(),
        authorName: user?.name || 'Anonymous'
      });
      if (res.data?.data) {
        setComments(prev => [res.data.data, ...prev]);
        setCommentText('');
      }
    } catch (_) {} finally {
      setCommentLoading(false);
    }
  }, [commentText, article, user]);

  // Toggle like on a comment
  const handleCommentLike = useCallback(async (commentId) => {
    if (!user) return;
    try {
      const res = await http.put(`/api/comments/${commentId}/like`);
      if (res.data?.data) {
        const likedCount = res.data.data.likes.length;
        setComments(prev => prev.map(c =>
          c._id === commentId ? { ...c, likes: res.data.data.likes } : c
        ));
        setLikedComments(prev => {
          const isNowLiked = res.data.data.likes.some(id => id === user._id || id === user.id);
          const next = { ...prev, [commentId]: isNowLiked };
          try { localStorage.setItem('likedComments', JSON.stringify(next)); } catch (_) {}
          return next;
        });
      }
    } catch (_) {}
  }, [user]);

  // Submit a reply to a comment
  const handleReplySubmit = useCallback(async (commentId) => {
    if (!replyText.trim()) return;
    try {
      const res = await http.post(`/api/comments/${commentId}/reply`, {
        text: replyText.trim(),
        authorName: user?.name || 'Anonymous'
      });
      if (res.data?.data) {
        setComments(prev => prev.map(c =>
          c._id === commentId
            ? { ...c, replies: [...(c.replies || []), res.data.data] }
            : c
        ));
        setReplyText('');
        setReplyingTo(null);
      }
    } catch (_) {}
  }, [replyText, user]);

  // Navigate to a specific category page
  const navigateToCategory = useCallback((category) => {
    if (!category) return;
    navigate(`/news/category/${category.toLowerCase()}`);
  }, [navigate]);
  
  // Handle gallery image click
  const openGallery = useCallback((index) => {
    setSelectedGalleryIndex(index);
    setShowGallery(true);

  }, []);
  
  useEffect(() => {
    if (!showGallery) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [showGallery]);

  // Handle gallery close
  const closeGallery = useCallback(() => {
    setShowGallery(false);

  }, []);

  const getImageUrl = imageData => formatNewsImagePath(imageData);

  // Add these functions near the beginning of your component
  const checkFailedImage = (url) => {
    try {
      const failedImages = JSON.parse(localStorage.getItem('failedNewsImages') || '{}');
      return !!failedImages[url];
    } catch (e) {
      return false;
    }
  };

  const markFailedImage = (url) => {
    try {
      const failedImages = JSON.parse(localStorage.getItem('failedNewsImages') || '{}');
      failedImages[url] = Date.now();
      // Limit cache size to prevent localStorage bloat
      const keys = Object.keys(failedImages);
      if (keys.length > 100) {
        const oldestKey = keys.sort((a, b) => failedImages[a] - failedImages[b])[0];
        delete failedImages[oldestKey];
      }
      localStorage.setItem('failedNewsImages', JSON.stringify(failedImages));
    } catch (e) {
      // Ignore localStorage errors
    }
  };

  // Render function for article content - NEW
  const renderArticleContent = () => {
    if (!article || !article.parsedContent) return null;

    const content = article.parsedContent;

    // If the content contains HTML tags, render it directly
    if (/<[a-z][\s\S]*>/i.test(content)) {
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }

    // Plain text fallback — split on double newlines into paragraphs
    return content.split('\n\n').filter(p => p.trim()).map((paragraph, index) => (
      <p key={index}>{paragraph}</p>
    ));
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !article) {
    return (
      <div className="cc-news-article-page">
        <div className="cc-news-article-not-found">
          <h2>{error || 'Article Not Found'}</h2>
          <p>The article you're looking for doesn't exist or has been removed.</p>
          <Link to="/news" className="cc-news-back-link">Return to News</Link>
        </div>
      </div>
    );
  }

  const authorInfo = getAuthorInfo(article);

  const articleImage = getNewsImageUrl(article);
  const articleUrl   = `${SITE_URL}/news/article/${getArticleIdentifier(article)}`;

  return (
    <div className="cc-news-article-page">
      {buildHelmet({
        title: article.title,
        description: article.seo?.metaDescription || article.subtitle || article.excerpt || article.title,
        image: articleImage,
        url: articleUrl,
        type: 'article',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: article.title,
          description: article.seo?.metaDescription || article.subtitle || '',
          image: articleImage ? [articleImage] : undefined,
          datePublished: article.publishDate || article.createdAt,
          dateModified: article.updatedAt || article.publishDate,
          url: articleUrl,
          publisher: { '@type': 'Organization', name: 'Bw Car Culture', url: SITE_URL }
        }
      })}
      {/* Full-screen gallery view */}
      {showGallery && (
        <NewsGallery 
          images={galleryImages} 
          onClose={closeGallery} 
          startIndex={selectedGalleryIndex}
        />
      )}

      <div className="cc-news-article-grid">
        <article className="cc-news-article-main">
          <nav className="cc-news-breadcrumb">
            <Link to="/news" className="cc-news-breadcrumb-link">
              <ChevronLeft size={16} />
              Back to News
            </Link>
            {article.category && (
              <button
                className="cc-news-category-pill"
                onClick={() => navigateToCategory(article.category)}
              >
                {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
              </button>
            )}
          </nav>

          <header className="cc-news-article-header">
            <h1>{cleanHtmlContent(article.title)}</h1>
            {article.subtitle && <h2>{cleanHtmlContent(article.subtitle)}</h2>}

            <div className="cc-news-article-meta">
              <div className="cc-news-author-info">
                <img 
                  src={getImageUrl(authorInfo.avatar, 'avatar')} 
                  alt={authorInfo.name} 
                  className="cc-news-author-avatar"
                  onError={(e) => {
                    markFailedImage(e.target.src);
                    e.target.onerror = null;
                    e.target.src = "/images/BCC Logo.png";
                  }}
                />
                <div className="cc-news-author-details">
                  <span className="cc-news-author-name">{authorInfo.name}</span>
                  {authorInfo.role && <span className="cc-news-author-role">{authorInfo.role}</span>}
                </div>
              </div>

              <div className="cc-news-article-stats">
                <span className="cc-news-stat-item"><Eye size={16} />{article.metadata?.views || 0} views</span>
                <span className="cc-news-stat-item">
                  <Calendar size={16} />
                  {formatDate(article.publishDate || article.createdAt || article.date)}
                </span>
                {article.metadata?.readTime && (
                  <span className="cc-news-stat-item">
                    <Clock size={16} />
                    {article.metadata.readTime} min read
                  </span>
                )}
              </div>

            </div>
          </header>

          <div className="cc-news-article-cover">
            <img 
              src={getNewsImageUrl(article)}
              alt={article.title} 
              onError={handleNewsImageError}
            />
            {article.featuredImage?.caption && (
              <div className="cc-news-image-caption">
                {article.featuredImage.caption}
                {article.featuredImage.credit && (
                  <span className="cc-news-image-credit"> - {article.featuredImage.credit}</span>
                )}
              </div>
            )}
          </div>

          <div className="cc-news-article-content">
            {renderArticleContent()}
          </div>

          {/* Inline photo gallery widget */}
          {galleryImages.length > 0 && (
            <div className="cc-news-inline-gallery">
              <div className="cc-news-ig-header">
                <Camera size={16} />
                <span>Photo Gallery</span>
                <span className="cc-news-ig-count">{galleryImages.length} photos</span>
              </div>

              {/* Main image */}
              <div className="cc-news-ig-main">
                <button
                  className="cc-news-ig-nav prev"
                  onClick={() => setSelectedGalleryIndex(i => (i === 0 ? galleryImages.length - 1 : i - 1))}
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={24} />
                </button>

                <img
                  key={selectedGalleryIndex}
                  src={galleryImages[selectedGalleryIndex]}
                  alt={`Photo ${selectedGalleryIndex + 1} of ${galleryImages.length}`}
                  className="cc-news-ig-main-img"
                  onClick={() => openGallery(selectedGalleryIndex)}
                  onError={handleNewsImageError}
                />

                <button
                  className="cc-news-ig-nav next"
                  onClick={() => setSelectedGalleryIndex(i => (i === galleryImages.length - 1 ? 0 : i + 1))}
                  aria-label="Next photo"
                >
                  <ChevronRight size={24} />
                </button>

                <div className="cc-news-ig-counter">{selectedGalleryIndex + 1} / {galleryImages.length}</div>
              </div>

              {/* Thumbnails strip */}
              {galleryImages.length > 1 && (
                <div className="cc-news-ig-thumbs">
                  {galleryImages.map((url, idx) => (
                    <div
                      key={idx}
                      className={`cc-news-ig-thumb ${idx === selectedGalleryIndex ? 'active' : ''}`}
                      onClick={() => setSelectedGalleryIndex(idx)}
                    >
                      <img
                        src={url}
                        alt={`Thumbnail ${idx + 1}`}
                        loading="lazy"
                        onError={handleNewsImageError}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <footer className="cc-news-article-footer">
            <div className="cc-news-article-tags">
              {Array.isArray(article.tags) && article.tags.map(tag => (
                <Link key={tag} to={`/news/tag/${tag.toLowerCase()}`} className="cc-news-tag">
                  <Tag size={14} />
                  {tag}
                </Link>
              ))}
              {article.category && !article.tags?.includes(article.category) && (
                <Link to={`/news/category/${article.category.toLowerCase()}`} className="cc-news-tag">
                  <Tag size={14} />
                  {article.category}
                </Link>
              )}
            </div>
          </footer>

          {/* Bottom action bar */}
          <div className="cc-news-article-action-bar">
            <button
              className={`cc-news-action-button ${liked ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={engagementLoading}
              aria-label={liked ? 'Unlike article' : 'Like article'}
            >
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
              <span>{liked ? 'Liked' : 'Like'}{article.metadata?.likes > 0 ? ` (${article.metadata.likes})` : ''}</span>
            </button>
            <button
              className={`cc-news-action-button ${isItemSaved(article) ? 'saved' : ''}`}
              onClick={handleSave}
              aria-label={isItemSaved(article) ? 'Unsave article' : 'Save article'}
            >
              {isItemSaved(article) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              <span>{isItemSaved(article) ? 'Saved' : 'Save'}</span>
            </button>
            <button className="cc-news-action-button" onClick={handleShare} aria-label="Share article">
              <Share2 size={16} />
              <span>Share</span>
            </button>
            <button
              className={`cc-news-action-button comment-btn ${showComments ? 'active' : ''}`}
              onClick={() => setShowComments(prev => !prev)}
              aria-label="Toggle comments"
            >
              <MessageSquare size={16} />
              <span>Comment{comments.length > 0 ? ` (${comments.length})` : ''}</span>
            </button>
          </div>

          {/* Comment section */}
          {showComments && (
            <div className="cc-news-comment-section">
              <h4>Comments {comments.length > 0 && <span className="cc-news-comment-count">({comments.length})</span>}</h4>

              {/* New comment form */}
              <div className="cc-news-comment-form">
                <textarea
                  className="cc-news-comment-input"
                  placeholder={user ? 'Share your thoughts…' : 'Comment as guest…'}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  rows={3}
                />
                <button
                  className="cc-news-comment-submit"
                  disabled={!commentText.trim() || commentLoading}
                  onClick={handleCommentSubmit}
                >
                  {commentLoading ? 'Posting…' : 'Post Comment'}
                </button>
              </div>

              {comments.length > 0 ? (
                <div className="cc-news-comment-list">
                  {comments.map(c => {
                    const cId = c._id || c.id;
                    const isLiked = likedComments[cId];
                    const likeCount = c.likes?.length || 0;
                    const replyCount = c.replies?.length || 0;
                    return (
                      <div key={cId} className="cc-news-comment-item">
                        <div className="cc-news-comment-avatar">
                          {c.authorAvatar
                            ? <img src={c.authorAvatar} alt={c.authorName} onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                            : (c.authorName || 'A')[0].toUpperCase()}
                        </div>
                        <div className="cc-news-comment-body">
                          <div className="cc-news-comment-header">
                            <span className="cc-news-comment-author">{c.authorName || c.author || 'Anonymous'}</span>
                            <span className="cc-news-comment-date">
                              {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : c.date}
                            </span>
                          </div>
                          <p className="cc-news-comment-text">{c.text}</p>
                          <div className="cc-news-comment-actions">
                            <button
                              className={`cc-news-comment-action-btn ${isLiked ? 'liked' : ''}`}
                              onClick={() => handleCommentLike(cId)}
                              title={user ? 'Like' : 'Sign in to like'}
                            >
                              <ThumbsUp size={13} fill={isLiked ? 'currentColor' : 'none'} />
                              {likeCount > 0 && <span>{likeCount}</span>}
                            </button>
                            <button
                              className="cc-news-comment-action-btn"
                              onClick={() => setReplyingTo(replyingTo === cId ? null : cId)}
                            >
                              <CornerDownRight size={13} />
                              <span>Reply{replyCount > 0 ? ` (${replyCount})` : ''}</span>
                            </button>
                          </div>

                          {/* Replies */}
                          {replyCount > 0 && (
                            <div className="cc-news-replies">
                              {c.replies.map((r, ri) => (
                                <div key={r._id || ri} className="cc-news-reply-item">
                                  <div className="cc-news-comment-avatar small">
                                    {r.authorAvatar
                                      ? <img src={r.authorAvatar} alt={r.authorName} onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                                      : (r.authorName || 'A')[0].toUpperCase()}
                                  </div>
                                  <div className="cc-news-comment-body">
                                    <div className="cc-news-comment-header">
                                      <span className="cc-news-comment-author">{r.authorName || 'Anonymous'}</span>
                                      <span className="cc-news-comment-date">
                                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
                                      </span>
                                    </div>
                                    <p className="cc-news-comment-text">{r.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reply form */}
                          {replyingTo === cId && (
                            <div className="cc-news-reply-form">
                              <textarea
                                className="cc-news-comment-input"
                                placeholder={`Reply to ${c.authorName || 'comment'}…`}
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                rows={2}
                              />
                              <div className="cc-news-reply-actions">
                                <button
                                  className="cc-news-comment-submit small"
                                  disabled={!replyText.trim()}
                                  onClick={() => handleReplySubmit(cId)}
                                >
                                  Post Reply
                                </button>
                                <button
                                  className="cc-news-comment-cancel"
                                  onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="cc-news-no-comments">No comments yet. Be the first!</p>
              )}
            </div>
          )}

          {/* More car news section - stays within the main column */}
          {moreNewsItems.length > 0 && (
            <div className="cc-news-more-articles">
              <div className="cc-news-more-header">
                <h3>More Car News</h3>
                <Link to="/news" className="cc-news-more-link">
                  View All <ArrowRight size={16} />
                </Link>
              </div>
              
              <div className="cc-news-more-grid">
                {moreNewsItems.map(newsItem => (
                  <Link 
                    key={newsItem._id || newsItem.id} 
                    to={`/news/article/${getArticleIdentifier(newsItem)}`}
                    className="cc-news-more-item"
                  >
                    <div className="cc-news-more-image">
                      <img 
                        src={getImageUrl(newsItem.featuredImage || newsItem.images?.[0])} 
                        alt={newsItem.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/placeholders/default.jpg';
                        }}
                      />
                      {newsItem.premium && (
                        <span className="cc-news-premium-badge">Premium</span>
                      )}
                    </div>
                    <div className="cc-news-more-content">
                      <h4>{cleanHtmlContent(newsItem.title)}</h4>
                      <div className="cc-news-more-meta">
                        <span className="cc-news-more-date">
                          <Calendar size={14} />
                          {formatDate(newsItem.publishDate || newsItem.createdAt || '')}
                        </span>
                        {newsItem.category && (
                          <span className="cc-news-more-category">
                            {newsItem.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        <aside className="cc-news-article-sidebar">
          <div className="cc-news-sidebar-tabs">
            <button 
              className={`cc-news-tab-button ${activeTab === 'articles' ? 'active' : ''}`}
              onClick={() => setActiveTab('articles')}
            >
              Related Articles
            </button>
            <button 
              className={`cc-news-tab-button ${activeTab === 'vehicles' ? 'active' : ''}`}
              onClick={() => setActiveTab('vehicles')}
            >
              Related Vehicles
            </button>
          </div>

          {activeTab === 'articles' && (
            <div className="cc-news-related-articles">
              {relatedArticles && relatedArticles.length > 0 ? (
                relatedArticles.map(related => (
                  <Link 
                    key={related._id || related.id} 
                    to={`/news/article/${getArticleIdentifier(related)}`}
                    className="cc-news-related-article"
                  >
                    <img 
                      src={getImageUrl(related.featuredImage || related.images?.[0])} 
                      alt={related.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/placeholders/default.jpg';
                      }}
                    />
                    <h4>{cleanHtmlContent(related.title)}</h4>
                    <span className="cc-news-related-article-date">
                      {formatDate(related.publishDate || related.createdAt || related.date || '')}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="cc-news-no-related">
                  <p>No related articles found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="cc-news-related-vehicles">
              {relatedVehicles && relatedVehicles.length > 0 ? (
                <div className="cc-news-vehicle-card-container">
                  {relatedVehicles.map(vehicle => (
                    <div key={vehicle._id || vehicle.id} className="cc-news-vehicle-card-wrapper">
                      <VehicleCard 
                        car={vehicle} 
                        compact={true} 
                        onShare={() => {}} 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="cc-news-no-related">
                  <p>No related vehicles found</p>
                  <Link to="/marketplace" className="cc-news-browse-more-link">
                    Browse All Vehicles
                  </Link>
                </div>
              )}
            </div>
          )}
          
          <div className="cc-news-ad-banner">
            <div className="cc-news-ad-content">
              <h3>Interested in a new car?</h3>
              <p>Browse our marketplace for the latest deals</p>
              <Link to="/marketplace" className="cc-news-ad-button">
                View Marketplace
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Featured Vehicles Section - Full Width */}
      <div className="cc-news-featured-vehicles-section">
        <h2 className="cc-news-featured-vehicles-heading">
          {articleVehicle(article).make || 'Related'} Vehicles For Sale
        </h2>
        
        {isFeaturedVehiclesLoading ? (
          <div className="cc-news-vehicles-loading">
            <div className="cc-news-loader"></div>
            <p>Loading vehicles...</p>
          </div>
        ) : featuredVehicles.length > 0 ? (
          <>
            <p className="cc-news-featured-vehicles-subtitle">
              Explore available vehicles related to this article
            </p>
            <div className="cc-news-featured-vehicles-grid">
              {featuredVehicles.map(vehicle => (
                <div key={vehicle._id || vehicle.id} className="cc-news-featured-vehicle-card">
                  <Link to={`/marketplace/${vehicle._id || vehicle.id}`} className="cc-news-featured-vehicle-link">
                    <div className="cc-news-featured-vehicle-image">
                      <img 
                        src={getImageUrl(vehicle.mainImage || vehicle.images?.[0])} 
                        alt={`${vehicle.make} ${vehicle.model}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/placeholders/car.jpg';
                        }}
                      />
                      {vehicle.dealer?.subscriptionTier === 'premium' && (
                        <span className="cc-news-premium-dealer-badge">Premium</span>
                      )}
                    </div>
                    <div className="cc-news-featured-vehicle-details">
                      <h3 className="cc-news-featured-vehicle-title">
                        {vehicle.title || [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ')}
                      </h3>
                      <div className="cc-news-featured-vehicle-info">
                        <div className="cc-news-featured-vehicle-price">
                          P{vehicle.price?.toLocaleString()}
                        </div>
                        <div className="cc-news-featured-vehicle-meta">
                          {vehicle.mileage && (
                            <span className="cc-news-featured-vehicle-spec">
                              {vehicle.mileage.toLocaleString()} km
                            </span>
                          )}
                          {vehicle.transmission && (
                            <span className="cc-news-featured-vehicle-spec">
                              {vehicle.transmission}
                            </span>
                          )}
                          {vehicle.fuelType && (
                            <span className="cc-news-featured-vehicle-spec">
                              {vehicle.fuelType}
                            </span>
                          )}
                        </div>
                        <div className="cc-news-featured-vehicle-dealer">
                          {vehicle.dealer?.name || 'Car Culture Dealer'}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
            <div className="cc-news-featured-vehicles-action">
              <Link to="/marketplace" className="cc-news-view-all-button">
                Browse All Vehicles
              </Link>
            </div>
          </>
        ) : (
          <div className="cc-news-empty-vehicles">
            <p>No related vehicles found at this time.</p>
            <Link to="/marketplace" className="cc-news-view-all-button">
              Browse Marketplace
            </Link>
          </div>
        )}
      </div>

      {/* These sections are now OUTSIDE the grid to take full width */}
      {/* Related Videos Section */}
      <div className="cc-news-related-videos-section">
        <VideoSection />
      </div>

      {/* Featured News Section */}
      <div className="cc-news-featured-section">
        <h2 className="cc-news-featured-heading">More Car News</h2>
        <FeaturedNews compact={true} excludeArticleId={article._id || article.id} />
      </div>

      {/* Sticky bottom bar — related cars for sale */}
      <StickyCarBar
        vehicles={featuredVehicles.length ? featuredVehicles : relatedVehicles}
        fetchParams={{ sort: '-listingQuality,-featured,-createdAt', limit: 12, status: 'active' }}
        label="Related Cars For Sale"
        sessionKey={`articleCarBar_${articleId}`}
      />
    </div>
  );
};

export default NewsArticle;