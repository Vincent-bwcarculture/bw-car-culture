import { prepareNewsUpload } from './newsUpload.js';

test('small multi-photo batches preserve every original file and repeated gallery field',async()=>{
 const data=new FormData();data.append('title','Three photos');
 for(let i=0;i<3;i++)data.append('galleryImages',new File(['image'],`photo-${i}.jpg`,{type:'image/jpeg'}));
 const compress=jest.fn();expect(await prepareNewsUpload(data,compress)).toBe(data);expect(compress).not.toHaveBeenCalled();expect(data.getAll('galleryImages')).toHaveLength(3);
});
test('large multi-photo uploads are optimized as a batch without dropping images or metadata',async()=>{
 const data=new FormData();data.append('title','Gallery');data.append('existingGallery','["keep.jpg"]');
 for(let i=0;i<3;i++)data.append('galleryImages',new File([new Uint8Array(2_000_000)],`photo-${i}.jpg`,{type:'image/jpeg'}));
 const compress=jest.fn(async file=>new File([new Uint8Array(500_000)],file.name,{type:file.type}));
 const result=await prepareNewsUpload(data,compress);
 expect(compress).toHaveBeenCalledTimes(3);expect(result.getAll('galleryImages')).toHaveLength(3);
 expect(result.getAll('galleryImages').map(file=>file.name)).toEqual(['photo-0.jpg','photo-1.jpg','photo-2.jpg']);
 expect(result.get('existingGallery')).toBe('["keep.jpg"]');expect(result.get('title')).toBe('Gallery');
});
test('oversized or undecodable batches report an actionable error instead of submitting a broken request',async()=>{
 const data=new FormData();data.append('galleryImages',new File([new Uint8Array(5_000_000)],'large.jpg',{type:'image/jpeg'}));
 await expect(prepareNewsUpload(data,async file=>file)).rejects.toThrow('too large to upload together');
 await expect(prepareNewsUpload(data,async()=>{throw new Error('decode');})).rejects.toThrow('Could not prepare an article photo');
});
