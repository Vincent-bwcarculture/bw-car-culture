import React,{act} from 'react';import {createRoot} from 'react-dom/client';
import { http } from '../config/axios.js';
import ListingManager from '../Admin/ListingManager/ListingManager.js';import {listingService} from '../services/listingService.js';
jest.mock('../context/AuthContext.js',()=>({useAuth:()=>({user:{role:'admin'}})}));
jest.mock('../services/listingService.js',()=>({listingService:{getListings:jest.fn(),updateListingStatus:jest.fn()}}));
jest.mock('../config/axios.js',()=>({http:{get:jest.fn(async()=>({data:{success:true,data:[]}}))}}));
jest.mock('../components/shared/AddListingModal/AddListingModal.js',()=>()=>null);jest.mock('../Admin/ListingManager/UpdateListingModal.js',()=>()=>null);
let root,container;beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);jest.clearAllMocks();http.get.mockResolvedValue({data:{success:true,data:[]}});listingService.getListings.mockResolvedValue({listings:[{_id:'first',title:'First car',status:'active',images:[],price:100},{_id:'second',title:'Second car',status:'active',images:[],price:200}],total:2,currentPage:1,totalPages:1});});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
const selectors=()=>container.querySelectorAll('.listings-table .listing-status-control select');
const render=async()=>{await act(async()=>root.render(<ListingManager/>));};
test('status saves disable only the affected listing and confirm the server result without prompts',async()=>{
 let resolve;listingService.updateListingStatus.mockImplementation(()=>new Promise(done=>{resolve=done;}));await render();
 expect(listingService.getListings.mock.calls[0][0]).toEqual(expect.objectContaining({adminView:true,status:'all'}));
 await act(async()=>{selectors()[0].value='sold';selectors()[0].dispatchEvent(new Event('change',{bubbles:true}));});
 expect(selectors()[0].disabled).toBe(true);expect(selectors()[1].disabled).toBe(false);
 await act(async()=>resolve({status:'sold'}));expect(selectors()[0].value).toBe('sold');expect(container.querySelector('.listing-status-notice').textContent).toContain('now sold');
});
test('failed status changes keep the original status and show a retryable error',async()=>{
 listingService.updateListingStatus.mockRejectedValue(new Error('Network unavailable'));await render();
 await act(async()=>{selectors()[0].value='sold';selectors()[0].dispatchEvent(new Event('change',{bubbles:true}));});
 expect(selectors()[0].value).toBe('active');expect(selectors()[0].disabled).toBe(false);expect(container.textContent).toContain('Network unavailable');
});
