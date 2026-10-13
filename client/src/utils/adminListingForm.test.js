import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import AddListingModal from '../components/shared/AddListingModal/AddListingModal.js';
import UpdateListingModal from '../Admin/ListingManager/UpdateListingModal.js';
import { dealerService } from '../services/dealerService.js';
import { listingFormErrors, listingDateInput, listingQuality } from './adminListingForm.js';

jest.mock('react-redux',()=>({useDispatch:()=>jest.fn()}),{virtual:true});
jest.mock('../services/listingService.js',()=>({listingService:{}}));
jest.mock('../context/AuthContext.js',()=>({useAuth:()=>({user:{role:'admin'}})}));
jest.mock('../components/ErrorBoundary.js',()=>({__esModule:true,default:({children})=>children}));
jest.mock('../services/dealerService.js',()=>{const service={getAllDealers:jest.fn(async()=>({success:true,dealers:[{_id:'seller',businessName:'Test dealer',contact:{phone:'71234567'}}]}))};return {__esModule:true,default:service,dealerService:service};});
let root,container;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);localStorage.clear();dealerService.getAllDealers.mockResolvedValue({success:true,dealers:[{_id:'seller',businessName:'Test dealer',contact:{phone:'71234567'}}]});URL.createObjectURL=jest.fn(file=>`blob:${file.name}`);URL.revokeObjectURL=jest.fn();global.requestAnimationFrame=callback=>callback();jest.spyOn(console,'log').mockImplementation(()=>{});});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();jest.restoreAllMocks();document.body.style.overflow='';});
const fixture=()=>({_id:'vehicle',title:'Toyota Hilux',description:'Vehicle description',category:'Truck',status:'active',price:250000,listingQuality:0,make:'Toyota',model:'Hilux',year:2022,mileage:0,dealer:{_id:'seller',businessName:'Test dealer',contact:{phone:'71234567'}},images:['https://example.test/one.jpg',{url:'https://example.test/two.jpg'}],seo:{metaTitle:'Search title',metaDescription:'Search description'}});
const render=async component=>{await act(async()=>root.render(component));};
const click=async element=>{await act(async()=>element.click());};
const section=label=>[...container.querySelectorAll('.tab-button')].find(button=>button.textContent===label);
const submit=async()=>{await act(async()=>container.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));};

test('edit prefills legacy specs, seller IDs, zero mileage and valid image URLs',async()=>{
 await render(<UpdateListingModal isOpen initialData={fixture()} onClose={jest.fn()} onSubmit={jest.fn()}/>);
 expect(container.querySelector('[name="dealer"]').value).toBe('seller');expect(container.querySelector('[name="specifications.make"]').value).toBe('Toyota');
 expect(container.querySelector('[name="specifications.mileage"]').value).toBe('0');expect(container.querySelector('.image-preview img').getAttribute('src')).toBe('https://example.test/one.jpg');
 expect(container.querySelector('[name="status"]').value).toBe('active');expect(container.querySelector('[role="dialog"]')).not.toBeNull();
});
test('removing one of two photos still saves the remaining photo and all editable metadata',async()=>{
 const save=jest.fn(async()=>{});await render(<UpdateListingModal isOpen initialData={fixture()} onClose={jest.fn()} onSubmit={save}/>);
 await click(section('Photos & video'));await click(container.querySelector('.remove-image'));await submit();
 expect(save).toHaveBeenCalledTimes(1);expect(save.mock.calls[0][0]).toEqual(expect.objectContaining({status:'active',category:'Truck',dealerId:'seller',listingQuality:0,seo:expect.objectContaining({metaTitle:'Search title'})}));
 expect(save.mock.calls[0][0].existingImages).toHaveLength(1);
 expect(save.mock.calls[0][0].dealer.businessName).toBe('Test dealer');
});
test('validation opens the section with the missing field instead of leaving a hidden error',async()=>{
 const data=fixture();data.make='';const save=jest.fn();await render(<UpdateListingModal isOpen initialData={data} onClose={jest.fn()} onSubmit={save}/>);await submit();
 expect(section('Specifications').getAttribute('aria-pressed')).toBe('true');expect(container.querySelector('[role="alert"]').textContent).toContain('Make is required');expect(save).not.toHaveBeenCalled();
});
test('adding photos does not revoke the previews of photos already selected',async()=>{
 await render(<AddListingModal isOpen onClose={jest.fn()} onSubmit={jest.fn()}/>);await click(section('Photos & video'));
 const input=container.querySelector('input[type="file"]');
 for(const name of ['one.jpg','two.jpg']){Object.defineProperty(input,'files',{configurable:true,value:[new File(['photo'],name,{type:'image/jpeg'})]});await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));}
 expect(container.querySelectorAll('.image-preview')).toHaveLength(2);expect(URL.revokeObjectURL).not.toHaveBeenCalled();
 await render(null);expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:one.jpg');
});
test('modal scroll lock is restored on close and next/previous section controls retain values',async()=>{
 document.body.style.overflow='auto';await render(<AddListingModal isOpen onClose={jest.fn()} onSubmit={jest.fn()}/>);expect(document.body.style.overflow).toBe('hidden');
 await click([...container.querySelectorAll('.form-actions button')].find(button=>button.textContent==='Next section'));expect(section('Specifications').getAttribute('aria-pressed')).toBe('true');
 await render(null);expect(document.body.style.overflow).toBe('auto');
});
test('year, price and discount ranges reject invalid values while POA and quality zero remain valid',()=>{
 const data={...fixture(),specifications:{make:'Toyota',model:'Hilux',year:1800,mileage:-1},priceOptions:{showSavings:true,dealerDiscount:100}};
 const errors=listingFormErrors(data,1,true);expect(errors['specifications.year']).toBeDefined();expect(errors['specifications.mileage']).toBeDefined();expect(errors['priceOptions.dealerDiscount']).toBeDefined();
 expect(listingQuality(0)).toBe(0);expect(listingDateInput('invalid-date')).toBe('');
 data.specifications.year=2022;data.specifications.mileage=0;data.price=0;data.priceOptions={showPriceAsPOA:true};expect(listingFormErrors(data,1,true)).toEqual({});
});
