import { listingService } from '../services/listingService.js';
import { imageService } from '../services/imageService.js';
jest.mock('../config/axios.js',()=>({__esModule:true,default:{create:()=>({post:jest.fn(),put:jest.fn(),patch:jest.fn(),get:jest.fn()})}}));
jest.mock('../services/imageService.js',()=>({imageService:{uploadMultiple:jest.fn()}}));
beforeEach(()=>{jest.clearAllMocks();localStorage.clear();jest.spyOn(console,'log').mockImplementation(()=>{});jest.spyOn(console,'error').mockImplementation(()=>{});});
afterEach(()=>jest.restoreAllMocks());
test('photo upload failures never publish a listing with fabricated image URLs',async()=>{
 imageService.uploadMultiple.mockRejectedValue(new Error('S3 offline'));
 await expect(listingService.createListing({title:'Vehicle'},[new File(['photo'],'one.jpg',{type:'image/jpeg'})])).rejects.toThrow('could not be uploaded');
 expect(listingService.axios.post).not.toHaveBeenCalled();
});
test('updates send status, contact overrides, feature groups, pricing and private records',async()=>{
 listingService.axios.put.mockResolvedValue({data:{success:true,data:{_id:'vehicle'}}});
 const data={title:'Vehicle',status:'sold',category:'Truck',listingQuality:0,dealerId:'seller',dealer:{contact:{phone:'71234567'}},shortDescription:'Summary',priceType:'negotiable',safetyFeatures:['ABS'],adminNotes:{notes:'Private'},existingImages:[{url:'keep.jpg'}]};
 await listingService.updateListing('vehicle',data);const payload=JSON.parse(listingService.axios.put.mock.calls[0][1].listingData);
 expect(payload).toEqual(expect.objectContaining(data));
});
test('failed status responses are reported rather than shown as successful changes',async()=>{
 listingService.axios.patch.mockResolvedValue({data:{success:false,message:'Status rejected'}});
 await expect(listingService.updateListingStatus('vehicle','sold')).rejects.toThrow('Status rejected');
});
