import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useParams } from 'react-router-dom';
import { http } from '../config/axios.js';
import { buildHelmet } from '../hooks/useSEO.js';
import { getGalleryImageUrls, getArticleIdentifier, handleNewsImageError } from './newsHelpers.js';
import NewsGallery from '../components/features/CarNews/NewsGallery.js';
import NewsArticle from '../components/features/CarNews/NewsArticle.js';
import ReviewModal from '../components/shared/ReviewModal/ReviewModal.js';

jest.mock('react-router-dom', () => ({ useParams: jest.fn(), useNavigate: () => jest.fn(), Link: ({to,children,...props}) => <a href={to} {...props}>{children}</a> }), {virtual:true});
jest.mock('react-redux', () => ({useDispatch: () => jest.fn()}), {virtual:true});
jest.mock('../config/axios.js', () => ({http:{get:jest.fn()}}));
jest.mock('../context/AuthContext.js', () => ({useAuth: () => ({user:{_id:'editor',role:'admin'}})}));
jest.mock('../context/NewsContext.js', () => ({useNews: () => ({getRelatedItems:()=>[],isItemSaved:()=>false,toggleSaveItem:jest.fn(),isItemViewed:()=>false})}));
jest.mock('../hooks/useSEO.js', () => ({buildHelmet:jest.fn(()=>null),SITE_URL:'https://bw-car-culture.vercel.app'}));
jest.mock('../components/shared/VehicleCard/VehicleCard.js',()=>()=>null);
jest.mock('../components/shared/LoadingScreen/LoadingScreen.js',()=>()=> <div>Loading article</div>);
jest.mock('../components/features/CarNews/FeaturedNews.js',()=>()=>null);
jest.mock('../components/features/VideoSection/VideoSection.js',()=>()=>null);
jest.mock('../components/shared/StickyCarBar/StickyCarBar.js',()=>()=>null);
let root,container;
const story = (id, gallery=[]) => ({_id:id,slug:`story-${id}`,title:`Story ${id}`,content:'<p>News content</p>',category:'news',featuredImage:'https://example.test/cover.jpg',gallery,tags:[],metadata:{}});
beforeEach(()=>{
 global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);
 useParams.mockReturnValue({articleId:'first'});http.get.mockReset();buildHelmet.mockImplementation(()=>null);
 jest.spyOn(console,'log').mockImplementation(()=>{});jest.spyOn(console,'warn').mockImplementation(()=>{});
 localStorage.clear();document.body.style.overflow='';URL.createObjectURL=jest.fn(()=> 'blob:preview');
});
afterEach(async()=>{await act(async()=>root.unmount());container.remove();jest.restoreAllMocks();});
const render=async component=>{await act(async()=>root.render(component));};
const click=async selector=>{await act(async()=>container.querySelector(selector).click());};
const setup=article=>http.get.mockImplementation(async url=>({data:{data:url.startsWith('/api/news/')?article:[]}}));
test('gallery normalization accepts legacy media shapes, removes duplicates and prefers full URLs',()=>{
 expect(getGalleryImageUrls({gallery:['https://example.test/a.jpg',{url:'https://example.test/b.jpg'},null],images:[{secure_url:'https://example.test/a.jpg'},{path:'/uploads/news/c.jpg'}]})).toEqual(['https://example.test/a.jpg','https://example.test/b.jpg','https://bw-car-culture-api.vercel.app/uploads/news/c.jpg']);
 expect(getArticleIdentifier({_id:'id',slug:'readable-story'})).toBe('readable-story');
});
test('failed images use one bounded fallback without rewriting a valid source URL',()=>{
 const image=document.createElement('img');image.src='https://example.test/missing.jpg';
 handleNewsImageError({currentTarget:image});const fallback=image.src;handleNewsImageError({currentTarget:image});expect(image.src).toBe(fallback);
 expect(localStorage.getItem('failedGalleryImages')).toBeNull();
});
test('gallery starts at a valid photo, supports keyboard navigation and Escape',async()=>{
 const close=jest.fn();await render(<NewsGallery images={['https://example.test/a.jpg','https://example.test/b.jpg']} startIndex={99} onClose={close}/>);
 expect(container.querySelector('.news-gallery-image').getAttribute('src')).toContain('b.jpg');
 await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})));
 expect(container.querySelector('.news-gallery-image').getAttribute('src')).toContain('a.jpg');
 await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
 expect(close).toHaveBeenCalledTimes(1);
});
test('article renders gallery immediately while an optional comments request is still pending',async()=>{
 http.get.mockImplementation(url=>url.startsWith('/api/comments/')?new Promise(()=>{}):Promise.resolve({data:{data:url==='/api/news/first'?story('first',['https://example.test/a.jpg']):[]}}));
 await render(<NewsArticle/>);expect(container.textContent).toContain('Photo Gallery');
 expect(container.querySelector('.cc-news-ig-main-img').getAttribute('src')).toBe('https://example.test/a.jpg');
 expect(buildHelmet.mock.calls.at(-1)[0].url).toBe('https://bw-car-culture.vercel.app/news/article/story-first');
});
test('opening gallery locks page scroll and unmount restores its prior value',async()=>{
 setup(story('first',['https://example.test/a.jpg']));document.body.style.overflow='auto';await render(<NewsArticle/>);
 await click('.cc-news-ig-main-img');expect(container.querySelector('[role="dialog"]')).not.toBeNull();expect(document.body.style.overflow).toBe('hidden');
 await render(null);expect(document.body.style.overflow).toBe('auto');
});
test('navigating to another article resets the photo index and removes stale content',async()=>{
 setup(story('first',['https://example.test/a.jpg','https://example.test/b.jpg']));await render(<NewsArticle/>);
 await click('[aria-label="Next photo"]');expect(container.querySelector('.cc-news-ig-main-img').getAttribute('src')).toContain('b.jpg');
 useParams.mockReturnValue({articleId:'second'});setup(story('second',['https://example.test/c.jpg']));await render(<NewsArticle/>);
 expect(container.querySelector('.cc-news-ig-main-img').getAttribute('src')).toContain('c.jpg');expect(container.textContent).not.toContain('Story first');
});
test('a slow previous article cannot overwrite a newly selected article',async()=>{
 let resolveFirst;http.get.mockImplementation(url=>url==='/api/news/first'?new Promise(resolve=>{resolveFirst=resolve;}):Promise.resolve({data:{data:url==='/api/news/second'?story('second'):[]}}));
 await render(<NewsArticle/>);useParams.mockReturnValue({articleId:'second'});await render(<NewsArticle/>);
 await act(async()=>resolveFirst({data:{data:story('first')}}));expect(container.querySelector('h1').textContent).toBe('Story second');
});
test('news editor sends new photos with the accepted field name and retains saved photos on edit',async()=>{
 localStorage.setItem('token','fixture');const submit=jest.fn().mockResolvedValue({});
 await render(<ReviewModal isOpen contentType="news" initialData={story('first',['https://example.test/old.jpg'])} onSubmit={submit} onClose={()=>{}}/>);
 const imagesTab=[...container.querySelectorAll('button')].find(b=>b.textContent.trim()==='Images');await act(async()=>imagesTab.click());
 const input=container.querySelector('input[type="file"]');const file=new File(['image-bytes'],'new.png',{type:'image/png'});Object.defineProperty(input,'files',{value:[file],configurable:true});
 await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));
 await act(async()=>container.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 expect(submit).toHaveBeenCalledTimes(1);const data=submit.mock.calls[0][0];expect(data.getAll('galleryImages')).toHaveLength(1);expect(data.getAll('gallery')).toHaveLength(0);expect(JSON.parse(data.get('existingGallery'))).toEqual([{url:'https://example.test/old.jpg'}]);
});
