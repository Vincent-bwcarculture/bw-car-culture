import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { NewsProvider, useNews } from '../context/NewsContext.js';
import { http } from '../config/axios.js';
import { articleVehicle, relevantVehicles, relatedNews, newsVisitorId } from './newsDiscovery.js';

jest.mock('../config/axios.js',()=>({http:{get:jest.fn()}}));
let root,container;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);http.get.mockReset();localStorage.clear();});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
const article=(id,extra={})=>({_id:id,title:`Article ${id}`,category:'review',status:'published',tags:[],...extra});
function Probe(){const value=useNews();return <><button onClick={()=>value.changeCategory('reviews')}>Reviews</button><button onClick={()=>value.changeCategory('all')}>All</button><button onClick={()=>value.changeCategory('industry')}>Industry</button><p>{value.loading?'Loading':value.newsItems.map(item=>item.title).join(',')}</p><span>{value.featuredNews.map(item=>item.title).join(',')}</span></>;}
const render=async()=>{await act(async()=>root.render(<NewsProvider autoplay={false}><Probe/></NewsProvider>));};
const click=async text=>{await act(async()=>[...container.querySelectorAll('button')].find(button=>button.textContent===text).click());};

test('vehicle recognition is case-insensitive, handles Maybach/JMC and never treats a body style as a model',()=>{
 expect(articleVehicle(article('a',{title:'The KIA EV9 three-row SUV'}))).toEqual({make:'Kia',model:'EV9'});
 expect(articleVehicle(article('b',{title:'Maybach S-Class launch'}))).toEqual({make:'Mercedes-Benz',model:'S-Class'});
 expect(articleVehicle(article('c',{title:'JMC Vigus DualCab'}))).toEqual({make:'JMC',model:'Vigus'});
 expect(articleVehicle(article('d',{title:'New Ford SUV'}))).toEqual({make:'Ford',model:null});
 expect(articleVehicle(article('e',{title:'A remarkable affordability story'}))).toEqual({make:null,model:null});
});
test('related listings exclude pending/wrong makes and rank the matching model first',()=>{
 const items=[{_id:'wrong',status:'active',make:'BMW',model:'X5'},{_id:'pending',status:'pending',make:'Kia',model:'EV9'},{_id:'make',status:'active',specifications:{make:'KIA',model:'Sportage'}},{_id:'model',status:'published',specifications:{make:'Kia',model:'EV9'}}];
 expect(relevantVehicles(items,{make:'Kia',model:'EV9'}).map(item=>item._id)).toEqual(['model','make']);
 expect(relevantVehicles(items,{make:'Kia',model:'EV9'})[0].model).toBe('EV9');
 expect(relevantVehicles(items,{make:null})).toEqual([]);
});
test('related articles exclude themselves and unrelated stories even when optional IDs are missing',()=>{
 const current=article('a',{title:'KIA EV9',tags:['electric']});
 const results=relatedNews(current,[current,article('b',{title:'Kia EV6',category:'news'}),article('c',{category:'reviews'}),article('d',{category:'industry'}),article('e',{title:'KIA EV9',status:'draft'})]);
 expect(results.map(item=>item._id)).toEqual(['b','c']);
});
test('visitor identity is stable across articles and survives corrupted stored values',()=>{
 const first=newsVisitorId();expect(newsVisitorId()).toBe(first);expect(first.length).toBeGreaterThanOrEqual(16);
 localStorage.setItem('newsVisitorId','bad');expect(newsVisitorId()).not.toBe('bad');
});
test('category changes clear empty results and All reloads the complete feed',async()=>{
 http.get.mockImplementation(async(_,config)=>({data:{data:config.params.featured?[]:config.params.category?[]:[article('all')],pagination:{totalPages:1}}}));
 await render();expect(container.querySelector('p').textContent).toBe('Article all');
 await click('Reviews');expect(container.querySelector('p').textContent).toBe('');
 expect(http.get.mock.calls.some(([,config])=>config.params.category==='review')).toBe(true);
 await click('All');expect(container.querySelector('p').textContent).toBe('Article all');
 expect(container.querySelector('span').textContent).toBe('');
});
test('slow category responses cannot overwrite a newly selected category',async()=>{
 let resolveReview;
 http.get.mockImplementation((_,config)=>config.params.category==='review'?new Promise(resolve=>{resolveReview=resolve;}):Promise.resolve({data:{data:config.params.featured?[]:[article(config.params.category||'all')],pagination:{totalPages:1}}}));
 await render();await click('Reviews');await click('Industry');
 await act(async()=>resolveReview({data:{data:[article('old-review')],pagination:{totalPages:1}}}));
 expect(container.querySelector('p').textContent).toBe('Article industry');
});
test('feed follows server pagination so search and popularity sorting are not restricted to the first eight articles',async()=>{
 http.get.mockImplementation(async(_,config)=>({data:{data:config.params.featured?[]:[article(`page-${config.params.page}`)],pagination:{totalPages:config.params.featured?1:2}}}));
 await render();expect(container.querySelector('p').textContent).toBe('Article page-1,Article page-2');
});
test('corrupt browser history cannot crash the news page',async()=>{
 localStorage.setItem('newsViewHistory','invalid');localStorage.setItem('newsSavedItems','{}');
 http.get.mockResolvedValue({data:{data:[],pagination:{totalPages:0}}});await render();expect(container.querySelector('p').textContent).toBe('');
});
