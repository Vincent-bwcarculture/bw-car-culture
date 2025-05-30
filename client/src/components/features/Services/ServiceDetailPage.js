// // src/components/pages/ServiceDetailPage/ServiceDetailPage.js
// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import { http } from '../../../config/axios';
// import { useAuth } from '../../../context/AuthContext';
// import { serviceProviderService } from '../../../services/serviceProviderService';
// import ServiceCard from '../../shared/ServiceCard/ServiceCard';
// import StarRating from '../../shared/StarRating/StarRating';
// import QRCodeScanner from '../../shared/QRCodeScanner/QRCodeScanner';
// import ShareModal from '../../shared/ShareModal';
// import './ServiceDetailPage.css';

// const ServiceDetailPage = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { user, isAuthenticated } = useAuth();
//   const [service, setService] = useState(null);
//   const [services, setServices] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState('about');
//   const [servicesPage, setServicesPage] = useState(1);
//   const [servicesPagination, setServicesPagination] = useState({
//     currentPage: 1,
//     totalPages: 1,
//     total: 0
//   });
//   const [servicesLoading, setServicesLoading] = useState(false);
//   const [servicesCount, setServicesCount] = useState(0);
  
//   // Review-related state
//   const [reviews, setReviews] = useState([]);
//   const [reviewsLoading, setReviewsLoading] = useState(false);
//   const [reviewsPage, setReviewsPage] = useState(1);
//   const [reviewsPagination, setReviewsPagination] = useState({
//     currentPage: 1,
//     totalPages: 1,
//     total: 0
//   });
//   const [reviewMode, setReviewMode] = useState(null); // null, 'write', 'qr', 'code', 'plate'
//   const [newReview, setNewReview] = useState({
//     rating: 0,
//     content: '',
//     serviceCode: '',
//     plateNumber: '',
//     anonymous: false
//   });
//   const [reviewSubmitting, setReviewSubmitting] = useState(false);
//   const [reviewError, setReviewError] = useState(null);
//   const [reviewSuccess, setReviewSuccess] = useState(false);
  
//   // Auth-related state
//   const [isAuthorized, setIsAuthorized] = useState(false);
  
//   // State for save functionality
//   const [isSaved, setIsSaved] = useState(false);
  
//   // State for share modal
//   const [shareModalOpen, setShareModalOpen] = useState(false);
//   const [selectedService, setSelectedServiceItem] = useState(null);
//   const [sharingService, setSharingService] = useState(false);
//   const shareButtonRef = useRef(null);

//   // Add this function to handle service image paths
//   const getServiceImageUrl = (imagePath) => {
//     if (!imagePath) {
//       console.log('No image path provided');
//       return null;
//     }
    
//     console.log('Original image path:', imagePath);
    
//     // If it already has http/https, it's a complete URL
//     if (imagePath.startsWith('http')) {
//       console.log('Using absolute URL:', imagePath);
//       return imagePath;
//     }
    
//     // If it's already a path with /uploads/services
//     if (imagePath.includes('/uploads/services/')) {
//       console.log('Using existing uploads path:', imagePath);
//       return imagePath;
//     }
    
//     // Extract just the filename if it has path elements
//     const filename = imagePath.split('/').pop();
//     const constructedPath = `/uploads/services/${filename}`;
//     console.log('Constructed path from filename:', constructedPath);
    
//     return constructedPath;
//   };

//   useEffect(() => {
//     fetchService();
//   }, [id]);

//   useEffect(() => {
//     // Always fetch services when service provider changes, regardless of active tab
//     if (service) {
//       fetchServices();
//     }
//   }, [service]);

//   useEffect(() => {
//     // Only fetch when services tab is active AND we have a service AND the page changes
//     if (service && activeTab === 'services') {
//       fetchServices();
//     }
//   }, [activeTab, servicesPage]);

//   useEffect(() => {
//     // Fetch reviews when the reviews tab is active and service is loaded
//     if (service && activeTab === 'reviews') {
//       fetchReviews();
//     }
//   }, [activeTab, reviewsPage, service]);
  
//   // Updated authorization check
//   useEffect(() => {
//     if (isAuthenticated && user && service) {
//       // Check if user is admin
//       const isAdmin = user.role === 'admin';
      
//       // Get user ID from service, handling both string and object cases
//       let serviceUserId = null;
//       if (service.user) {
//         serviceUserId = typeof service.user === 'string' ? service.user : service.user._id;
//       }
      
//       // Get user ID, ensuring it's a string
//       const userId = String(user._id);
      
//       // Check if user is owner (strict comparison after string conversion)
//       const isOwner = serviceUserId && String(serviceUserId) === userId;
      
//       // Check if user has provider role
//       const isProvider = user.role === 'provider';
      
//       console.log('Auth Check Details:', {
//         isAdmin,
//         isOwner,
//         isProvider,
//         userId,
//         serviceUserId,
//         userRole: user.role
//       });
      
//       // User is authorized if they are admin, owner, or have provider role
//       setIsAuthorized(isAdmin || isOwner || isProvider);
//     } else {
//       setIsAuthorized(false);
//     }
//   }, [isAuthenticated, user, service]);

//   // Add right after the authorization useEffect
// useEffect(() => {
//   if (service && user) {
//     console.log('=== AUTHORIZATION DEBUG ===');
//     console.log('User data:', {
//       id: user._id,
//       name: user.name,
//       role: user.role,
//       email: user.email
//     });
//     console.log('Service data:', {
//       id: service._id,
//       name: service.businessName,
//       userId: service.user ? (typeof service.user === 'string' ? service.user : service.user._id) : 'No user ID'
//     });
//     console.log('Authorization result:', isAuthorized);
//     console.log('========================');
//   }
// }, [isAuthorized, user, service]);
  
//   // Check if service is saved
//   useEffect(() => {
//     if (service) {
//       const savedServices = JSON.parse(localStorage.getItem('savedServices') || '[]');
//       setIsSaved(savedServices.includes(service._id));
//     }
//   }, [service]);

//   const fetchService = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const response = await http.get(`/services/${id}`);
      
//       if (response.data.success) {
//         console.log('Service data received:', response.data.data);
//         console.log('Service profile images:', {
//           banner: response.data.data.profile?.banner,
//           logo: response.data.data.profile?.logo
//         });
        
//         setService(response.data.data);
        
//         // If we have a service, fetch the first page of services
//         if (response.data.data) {
//           fetchServices(1);
//         }
//       } else {
//         throw new Error(response.data.message || 'Failed to fetch service');
//       }
//     } catch (error) {
//       console.error('Error fetching service:', error);
//       setError('Failed to load service provider information. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchServices = async () => {
//     try {
//       if (!service) {
//         console.warn('Cannot fetch services: no service provider data available');
//         return;
//       }
      
//       setServicesLoading(true);
      
//       // Get service ID directly from the URL parameter to ensure consistency
//       const serviceId = id;
      
//       if (!serviceId) {
//         console.warn('Cannot fetch services: service ID is missing in URL');
//         return;
//       }
      
//       console.log(`Attempting to fetch services for service provider ID: ${serviceId}`);
      
//       // Use direct HTTP request with better error handling
//       try {
//         const response = await http.get(`/services/${serviceId}/offerings`, {
//           params: { page: servicesPage, limit: 10 }
//         });
        
//         if (response.data && response.data.success) {
//           console.log(`Successfully fetched ${response.data.data.length} services`);
//           setServices(response.data.data || []);
          
//           // Get the total count from the response
//           const totalServices = response.data.total || response.data.data?.length || 0;
          
//           setServicesPagination({
//             currentPage: response.data.pagination?.currentPage || 1,
//             totalPages: response.data.pagination?.totalPages || 1,
//             total: totalServices
//           });
          
//           // IMPORTANT: Only update the services count state, don't modify service object
//           setServicesCount(totalServices);
          
//           console.log(`Updated services count to: ${totalServices}`);
//         } else {
//           console.warn(`API returned success:false: ${response.data?.message || 'Unknown error'}`);
//           setServices([]);
//         }
//       } catch (error) {
//         console.error(`Error fetching services: ${error.message}`);
        
//         // Fallback to try alternate endpoint format
//         try {
//           console.log('Trying alternative endpoint format');
//           const fallbackResponse = await fetch(`/api/services/${serviceId}/offerings`);
//           const data = await fallbackResponse.json();
          
//           if (data.success) {
//             console.log(`Successfully fetched ${data.data.length} services with fallback`);
//             setServices(data.data || []);
            
//             // Get the total count from the fallback response
//             const totalServices = data.total || data.data?.length || 0;
            
//             setServicesPagination({
//               currentPage: data.pagination?.currentPage || 1,
//               totalPages: data.pagination?.totalPages || 1,
//               total: totalServices
//             });
            
//             // IMPORTANT: Only update the services count state
//             setServicesCount(totalServices);
            
//             console.log(`Updated services count to: ${totalServices} (from fallback)`);
//           } else {
//             console.warn('Fallback API call also failed');
//             setServices([]);
//           }
//         } catch (fallbackError) {
//           console.error(`Fallback also failed: ${fallbackError.message}`);
//           setServices([]);
//         }
//       }
//     } catch (error) {
//       console.error(`Error in fetchServices: ${error.message}`);
//       setServices([]);
//     } finally {
//       setServicesLoading(false);
//     }
//   };

//   // Fetch reviews for this service provider
//   const fetchReviews = async () => {
//     try {
//       setReviewsLoading(true);
//       setReviewError(null);
      
//       const response = await http.get(`/reviews/service/${id}`, {
//         params: { page: reviewsPage, limit: 10 }
//       });
      
//       if (response.data.success) {
//         setReviews(response.data.data || []);
//         setReviewsPagination({
//           currentPage: response.data.pagination?.currentPage || 1,
//           totalPages: response.data.pagination?.totalPages || 1,
//           total: response.data.total || response.data.data?.length || 0
//         });
//       } else {
//         console.warn(`API returned success:false for reviews: ${response.data?.message}`);
//         setReviews([]);
//       }
//     } catch (error) {
//       console.error('Error fetching reviews:', error);
//       // Don't set a UI error for this, just log it
//     } finally {
//       setReviewsLoading(false);
//     }
//   };

//   // Toggle save service
//   const toggleSaveService = () => {
//     if (!service) return;
    
//     const savedServices = JSON.parse(localStorage.getItem('savedServices') || '[]');
    
//     if (isSaved) {
//       const newSavedServices = savedServices.filter(id => id !== service._id);
//       localStorage.setItem('savedServices', JSON.stringify(newSavedServices));
//       setIsSaved(false);
//     } else {
//       const newSavedServices = [...savedServices, service._id];
//       localStorage.setItem('savedServices', JSON.stringify(newSavedServices));
//       setIsSaved(true);
//     }
//   };

//   // Handle share modal for services
//   const handleShareServiceItem = (serviceItem, buttonRef) => {
//     setSelectedServiceItem(serviceItem);
//     setSharingService(false);
//     shareButtonRef.current = buttonRef;
//     setShareModalOpen(true);
//   };
  
//   // Handle share modal for service provider
//   const handleShareService = (event) => {
//     shareButtonRef.current = event.currentTarget;
//     setSharingService(true);
//     setSelectedServiceItem(null);
//     setShareModalOpen(true);
//   };

//   const handleContactService = () => {
//     if (!service || !service.contact) return;
    
//     // Open mailto link or phone number based on available contact info
//     if (service.contact.email) {
//       window.location.href = `mailto:${service.contact.email}?subject=Inquiry about your services on Car Culture`;
//     } else if (service.contact.phone) {
//       window.location.href = `tel:${service.contact.phone}`;
//     }
//   };
  
//   const handleWhatsAppContact = () => {
//     if (!service || !service.contact?.phone) return;
    
//     // Format phone number (remove any non-digit characters)
//     const phone = service.contact.phone.replace(/\D/g, '');
    
//     // Create message
//     const message = `Hello ${service.businessName}, I'm interested in your services listed on Car Culture.`;
    
//     // Create WhatsApp URL
//     const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
//     // Open in new tab
//     window.open(whatsappUrl, '_blank');
//   };

//   const handleWebsiteClick = () => {
//     if (!service || !service.contact?.website) return;
    
//     // Add https if not present
//     let website = service.contact.website;
//     if (!website.startsWith('http')) {
//       website = `https://${website}`;
//     }
    
//     window.open(website, '_blank');
//   };

//   // Updated access dashboard function with debug logging
//   const handleAccessDashboard = () => {
//     console.log(`Navigating to dashboard for service ${id}, user role: ${user?.role}`);
//     navigate(`/gion/provider/service/${id}`);
//   };

//   const formatWorkingHours = (hours) => {
//     if (!hours) return 'Not available';
    
//     const { open, close } = hours;
//     if (!open || !close) return 'Closed';
    
//     return `${open} - ${close}`;
//   };

//   const getBusinessTypeLabel = (type) => {
//     switch (type) {
//       case 'workshop':
//         return 'Workshop';
//       case 'bodyshop':
//         return 'Body Shop';
//       case 'carwash':
//         return 'Car Wash';
//       case 'tireshop':
//         return 'Tire Shop';
//       case 'mechanic':
//         return 'Mechanic';
//       default:
//         return type;
//     }
//   };

//   // Toggle write review mode
//   const toggleWriteReview = () => {
//     console.log('Toggle write review clicked', { currentMode: reviewMode });
    
//     if (reviewMode === 'write') {
//       // If already in write mode, cancel and return to default state
//       setReviewMode(null);
//       // Reset form data is optional here since we're closing the form
//     } else {
//       // Switch to write mode and reset all review-related states
//       setReviewMode('write');
      
//       // Reset the form data
//       setNewReview({
//         rating: 0,
//         content: '',
//         serviceCode: '',
//         plateNumber: '',
//         anonymous: false
//       });
      
//       // Clear any previous errors or success messages
//       setReviewError(null);
//       setReviewSuccess(false);
      
//       // Reset submission state
//       setReviewSubmitting(false);
//     }
    
//     // Log state change (note: this will show the previous state due to React's asynchronous state updates)
//     console.log('Toggling review mode to:', reviewMode === 'write' ? null : 'write');
    
//     // Scroll to the review section (optional but helpful UX improvement)
//     setTimeout(() => {
//       const reviewSection = document.querySelector('.bcc-service-review-collection') || 
//                             document.querySelector('.bcc-dealer-review-collection');
//       if (reviewSection) {
//         reviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
//       }
//     }, 100);
//   };
  
//   // Switch to QR code scanning mode
//   const handleScanQR = () => {
//     setReviewMode('qr');
//     setReviewError(null);
//   };
  
//   // Switch to service code entry mode
//   const handleServiceCode = () => {
//     setReviewMode('code');
//     setReviewError(null);
//   };
  
//   // Switch to plate number entry mode (for transport services)
//   const handlePlateNumber = () => {
//     setReviewMode('plate');
//     setReviewError(null);
//   };
  
//   // Handle QR code scan result
//   const handleQRResult = (result) => {
//     try {
//       // Expected format for QR: businessType|id|serviceName
//       const [type, serviceId, name] = result.split('|');
      
//       if (type !== 'service' || serviceId !== id) {
//         setReviewError('Invalid QR code. Please scan a code for this service provider.');
//         return;
//       }
      
//       // QR is valid for this service, switch to write review mode
//       setReviewMode('write');
//       setNewReview({
//         ...newReview,
//         serviceCode: serviceId
//       });
//     } catch (error) {
//       setReviewError('Invalid QR code format. Please try again.');
//     }
//   };
  
//   // Handle service code submission
//   const handleCodeSubmit = () => {
//     if (!newReview.serviceCode.trim()) {
//       setReviewError('Please enter a service code');
//       return;
//     }
    
//     // In a real application, you would validate the code against the backend
//     // Here we'll just check if it's the right format
//     if (newReview.serviceCode.startsWith('S') && newReview.serviceCode.length >= 5) {
//       setReviewMode('write');
//     } else {
//       setReviewError('Invalid service code. Please try again.');
//     }
//   };
  
//   // Handle plate number submission
//   const handlePlateSubmit = () => {
//     if (!newReview.plateNumber.trim()) {
//       setReviewError('Please enter a license plate number');
//       return;
//     }
    
//     // In a real application, you would validate the plate against the backend
//     // Here we'll just switch to write mode
//     setReviewMode('write');
//   };
  
//   // Handle changes to the review form
//   const handleReviewChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setNewReview({
//       ...newReview,
//       [name]: type === 'checkbox' ? checked : value
//     });
//   };
  
//   // Handle rating change
//   const handleRatingChange = (rating) => {
//     setNewReview({
//       ...newReview,
//       rating
//     });
//   };
  
//   // Submit a review
//   const handleSubmitReview = async (e) => {
//     e.preventDefault();
    
//     if (newReview.rating === 0) {
//       setReviewError('Please select a rating');
//       return;
//     }
    
//     try {
//       setReviewSubmitting(true);
//       setReviewError(null);
      
//       // Prepare the review data
//       const reviewData = {
//         businessType: 'service',
//         businessId: id,
//         rating: newReview.rating,
//         content: newReview.content,
//         anonymous: newReview.anonymous
//       };
      
//       // Add optional fields if they exist
//       if (newReview.serviceCode) {
//         reviewData.serviceCode = newReview.serviceCode;
//       }
      
//       if (newReview.plateNumber) {
//         reviewData.plateNumber = newReview.plateNumber;
//       }
      
//       // Send the review to the backend
//       const response = await http.post('/reviews', reviewData);
      
//       if (response.data.success) {
//         // Show success message
//         setReviewSuccess(true);
        
//         // Clear the form
//         setNewReview({
//           rating: 0,
//           content: '',
//           serviceCode: '',
//           plateNumber: '',
//           anonymous: false
//         });
        
//         // Refresh reviews
//         fetchReviews();
        
//         // After a delay, close the review form
//         setTimeout(() => {
//           setReviewMode(null);
//           setReviewSuccess(false);
//         }, 3000);
//       } else {
//         setReviewError(response.data.message || 'Failed to submit review');
//       }
//     } catch (error) {
//       console.error('Error submitting review:', error);
//       setReviewError('Failed to submit review. Please try again.');
//     } finally {
//       setReviewSubmitting(false);
//     }
//   };
  
//   // Format date for reviews
//   const formatReviewDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   if (loading) {
//     return (
//       <div className="bcc-service-loading-page">
//         <div className="bcc-service-spinner"></div>
//       </div>
//     );
//   }

//   if (error || !service) {
//     return (
//       <div className="bcc-service-error-page">
//         <div className="bcc-service-error-container">
//           <h2>{error || 'Service not found'}</h2>
//           <p>The service provider you're looking for doesn't exist or has been removed.</p>
//           <button className="bcc-service-back-button" onClick={() => navigate('/services')}>
//             ← Back to Services
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bcc-service-detail-page">
//       <div className="bcc-service-banner">
//         {service.profile?.banner ? (
//           <img 
//             src={getServiceImageUrl(service.profile.banner)} 
//             alt={service.businessName} 
//             className="bcc-service-banner-image"
//             onError={(e) => {
//               console.log(`Banner image failed to load: ${e.target.src}`);
//               e.target.src = '/images/placeholders/service-banner.jpg';
//             }}
//           />
//         ) : (
//           <div className="bcc-service-default-banner"></div>
//         )}
        
//         {/* Save and Share buttons */}
//         <div className="bcc-service-action-buttons">
//           <button 
//             className={`bcc-service-save-button ${isSaved ? 'saved' : ''}`}
//             onClick={toggleSaveService}
//             aria-label={isSaved ? 'Remove from saved' : 'Save service provider'}
//           >
//             {isSaved ? '♥' : '♡'}
//           </button>
//           <button
//             className="bcc-service-share-button"
//             onClick={handleShareService}
//             aria-label="Share service provider"
//             ref={shareButtonRef}
//           >
//             ↗
//           </button>
//         </div>
        
//         <div className="bcc-service-banner-overlay">
//           <div className="bcc-service-info-container">
//             <div className="bcc-service-logo-container">
//               {service.profile?.logo ? (
//                 <img 
//                   src={getServiceImageUrl(service.profile.logo)} 
//                   alt={service.businessName} 
//                   className="bcc-service-logo"
//                   onError={(e) => {
//                     console.log(`Logo image failed to load: ${e.target.src}`);
//                     e.target.src = '/images/placeholders/service-logo.jpg';
//                   }}
//                 />
//               ) : (
//                 <div className="bcc-service-logo-placeholder">
//                   {service.businessName.charAt(0)}
//                 </div>
//               )}
//             </div>
            
//             <div className="bcc-service-header-info">
//               <div className="bcc-service-title-container">
//                 <h1>{service.businessName}</h1>
//                 {service.verification?.status === 'verified' && (
//                   <div className="bcc-service-verified">✓ Verified</div>
//                 )}
//               </div>
              
//               <div className="bcc-service-type-location">
//                 <span className="bcc-service-type">{getBusinessTypeLabel(service.businessType)}</span>
//                 {service.location && (
//                   <span className="bcc-service-location">
//                     <i className="bcc-service-location-icon">📍</i>
//                     {service.location.city}{service.location.country ? `, ${service.location.country}` : ''}
//                   </span>
//                 )}
//               </div>
              
//               {service.metrics && (
//                 <div className="bcc-service-metrics">
//                   <div className="bcc-service-metric">
//                     {/* Use servicesCount first, then fall back to service metrics */}
//                     <span className="bcc-service-metric-value">{servicesCount || service.metrics?.totalServices || 0}</span>
//                     <span className="bcc-service-metric-label">Services</span>
//                   </div>
                  
//                   {service.metrics.averageRating > 0 && (
//                     <div className="bcc-service-metric">
//                       <span className="bcc-service-metric-value">
//                         <span className="bcc-service-stars">
//                           {"★".repeat(Math.floor(service.metrics.averageRating))}
//                           {service.metrics.averageRating % 1 > 0 ? "½" : ""}
//                         </span>
//                         <span className="bcc-service-rating-number">{service.metrics.averageRating.toFixed(1)}</span>
//                       </span>
//                       <span className="bcc-service-metric-label">{service.metrics.totalReviews} reviews</span>
//                     </div>
//                   )}
//                 </div>
//               )}
              
//               {/* Contact details */}
//               <div className="bcc-service-quick-contact">
//                 {service.contact?.phone && (
//                   <div className="bcc-service-phone">
//                     <span className="bcc-service-contact-label">Phone:</span>
//                     <a href={`tel:${service.contact.phone}`}>{service.contact.phone}</a>
//                   </div>
//                 )}
//                 {service.contact?.email && (
//                   <div className="bcc-service-email">
//                     <span className="bcc-service-contact-label">Email:</span>
//                     <a href={`mailto:${service.contact.email}`}>{service.contact.email}</a>
//                   </div>
//                 )}
//               </div>
//             </div>
            
//             <div className="bcc-service-actions">
//               <button className="bcc-service-contact-button" onClick={handleContactService}>
//                 Contact Service
//               </button>
              
//               <button className="bcc-service-whatsapp-button" onClick={handleWhatsAppContact}>
//                 WhatsApp
//               </button>
              
//               {service.contact?.website && (
//                 <button className="bcc-service-website-button" onClick={handleWebsiteClick}>
//                   Visit Website
//                 </button>
//               )}
              
//               {/* Updated dashboard access button with improved styling */}
//               {isAuthorized && (
//                 <button 
//                   className="bcc-service-dashboard-button" 
//                   onClick={handleAccessDashboard}
//                   style={{ 
//                     display: 'block', 
//                     marginTop: '1rem',
//                     background: '#4a4af7',
//                     color: 'white',
//                     fontWeight: 'bold',
//                     padding: '0.8rem 1.5rem'
//                   }}
//                 >
//                   {user?.role === 'admin' ? 'Access Admin Dashboard' : 'Manage Your Service'}
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
      
//       <div className="bcc-service-content">
//         <div className="bcc-service-tabs">
//           <button 
//             className={`bcc-service-tab-button ${activeTab === 'about' ? 'active' : ''}`}
//             onClick={() => setActiveTab('about')}
//           >
//             About
//           </button>
//           <button 
//             className={`bcc-service-tab-button ${activeTab === 'services' ? 'active' : ''}`}
//             onClick={() => setActiveTab('services')}
//           >
//             {/* Use servicesCount first, then fallback to service metrics */}
//             Services ({servicesCount || service.metrics?.totalServices || 0})
//           </button>
//           <button 
//             className={`bcc-service-tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
//             onClick={() => setActiveTab('reviews')}
//           >
//             Reviews ({service.metrics?.totalReviews || 0})
//           </button>
//           <button 
//             className={`bcc-service-tab-button ${activeTab === 'contact' ? 'active' : ''}`}
//             onClick={() => setActiveTab('contact')}
//           >
//             Contact
//           </button>
//         </div>
        
//         <div className="bcc-service-tab-content">
//           {activeTab === 'about' && (
//             <div className="bcc-service-about-tab">
//               <div className="bcc-service-description">
//                 <h2>About {service.businessName}</h2>
//                 <p>{service.profile?.description || 'No description available.'}</p>
                
//                 {service.profile?.specialties && service.profile.specialties.length > 0 && (
//                   <div className="bcc-service-specialties-section">
//                     <h3>Specialties</h3>
//                     <div className="bcc-service-specialties-list">
//                       {service.profile.specialties.map((specialty, index) => (
//                         <span className="bcc-service-specialty-tag" key={index}>{specialty}</span>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
              
//               <div className="bcc-service-business-hours">
//                 <h3>Business Hours</h3>
                
//                 {service.profile?.workingHours ? (
//                   <table className="bcc-service-hours-table">
//                     <tbody>
//                       <tr>
//                         <td>Monday</td>
//                         <td>{formatWorkingHours(service.profile.workingHours.monday)}</td>
//                       </tr>
//                       <tr>
//                         <td>Tuesday</td>
//                         <td>{formatWorkingHours(service.profile.workingHours.tuesday)}</td>
//                       </tr>
//                       <tr>
//                         <td>Wednesday</td>
//                         <td>{formatWorkingHours(service.profile.workingHours.wednesday)}</td>
//                       </tr>
//                       <tr>
//                         <td>Thursday</td>
//                         <td>{formatWorkingHours(service.profile.workingHours.thursday)}</td>
//                       </tr>
//                       <tr>
//                         <td>Friday</td>
//                         <td>{formatWorkingHours(service.profile.workingHours.friday)}</td>
//                       </tr>
//                       <tr>
//                         <td>Saturday</td>
//                         <td>{formatWorkingHours(service.profile.workingHours.saturday)}</td>
//                       </tr>
//                       <tr>
//                         <td>Sunday</td>
//                         <td>{formatWorkingHours(service.profile.workingHours.sunday)}</td>
//                       </tr>
//                     </tbody>
//                   </table>
//                 ) : (
//                   <p className="bcc-service-no-hours">Working hours not provided</p>
//                 )}
                
//                 {/* Social media links */}
//                 {service.contact?.social && Object.values(service.contact.social).some(value => value) && (
//                   <div className="bcc-service-social-section">
//                     <h3>Social Media</h3>
//                     <div className="bcc-service-social-links">
//                       {service.contact.social.facebook && (
//                         <a 
//                           href={service.contact.social.facebook} 
//                           target="_blank" 
//                           rel="noopener noreferrer"
//                           className="bcc-service-social-link bcc-service-social-facebook"
//                           aria-label="Facebook"
//                         >
//                           f
//                         </a>
//                       )}
//                       {service.contact.social.twitter && (
//                         <a 
//                           href={service.contact.social.twitter} 
//                           target="_blank" 
//                           rel="noopener noreferrer"
//                           className="bcc-service-social-link bcc-service-social-twitter"
//                           aria-label="Twitter"
//                         >
//                           t
//                         </a>
//                       )}
//                       {service.contact.social.instagram && (
//                         <a 
//                           href={service.contact.social.instagram} 
//                           target="_blank" 
//                           rel="noopener noreferrer"
//                           className="bcc-service-social-link bcc-service-social-instagram"
//                           aria-label="Instagram"
//                         >
//                           i
//                         </a>
//                       )}
//                       {service.contact.social.whatsapp && (
//                         <a 
//                           href={`https://wa.me/${service.contact.social.whatsapp}`} 
//                           target="_blank" 
//                           rel="noopener noreferrer"
//                           className="bcc-service-social-link bcc-service-social-whatsapp"
//                           aria-label="WhatsApp"
//                         >
//                           w
//                         </a>
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
          
//           {activeTab === 'services' && (
//             <div className="bcc-service-services-tab">
//               <h2>Services Offered</h2>
              
//               {servicesLoading ? (
//                 <div className="bcc-service-loading-container">
//                   <div className="bcc-service-spinner"></div>
//                 </div>
//               ) : services.length === 0 ? (
//                 <div className="bcc-service-no-services">
//                   <p>This service provider currently has no listed services.</p>
//                 </div>
//               ) : (
//                 <>
//                   <div className="bcc-service-services-grid">
//                     {services.map(serviceItem => (
//                       <ServiceCard 
//                         key={serviceItem._id} 
//                         service={serviceItem}
//                         onShare={(buttonRef) => handleShareServiceItem(serviceItem, buttonRef)}
//                       />
//                     ))}
//                   </div>
                  
//                   {/* Services Pagination */}
//                   {servicesPagination.totalPages > 1 && (
//                     <div className="bcc-service-pagination">
//                       <button 
//                         className="bcc-service-page-button prev" 
//                         onClick={() => setServicesPage(servicesPagination.currentPage - 1)}
//                         disabled={servicesPagination.currentPage === 1}
//                       >
//                         Previous
//                       </button>
                      
//                       {Array.from({ length: Math.min(5, servicesPagination.totalPages) }).map((_, index) => {
//                         // Calculate which pages to show
//                         let pageToShow;
//                         if (servicesPagination.totalPages <= 5) {
//                           pageToShow = index + 1;
//                         } else if (servicesPagination.currentPage <= 3) {
//                           pageToShow = index + 1;
//                         } else if (servicesPagination.currentPage >= servicesPagination.totalPages - 2) {
//                           pageToShow = servicesPagination.totalPages - 4 + index;
//                         } else {
//                           pageToShow = servicesPagination.currentPage - 2 + index;
//                         }
                        
//                         return (
//                           <button
//                             key={pageToShow}
//                             className={`bcc-service-page-number ${servicesPagination.currentPage === pageToShow ? 'active' : ''}`}
//                             onClick={() => setServicesPage(pageToShow)}
//                           >
//                             {pageToShow}
//                           </button>
//                         );
//                       })}
                      
//                       <button 
//                         className="bcc-service-page-button next" 
//                         onClick={() => setServicesPage(servicesPagination.currentPage + 1)}
//                         disabled={servicesPagination.currentPage === servicesPagination.totalPages}
//                       >
//                         Next
//                       </button>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           )}
          
//           {/* REVIEWS TAB */}
//           {activeTab === 'reviews' && (
//             <div className="bcc-service-reviews-tab">
//               <h2>Customer Reviews</h2>
              
//               {/* Review Actions - Always visible at the top */}
//               <div className="bcc-service-reviews-actions">
//                 {reviewMode ? (
//                   <button 
//                     className="bcc-service-cancel-review-button"
//                     onClick={() => setReviewMode(null)}
//                   >
//                     Cancel
//                   </button>
//                 ) : (
//                   <button 
//                     className="bcc-service-write-review-button"
//                     onClick={toggleWriteReview}
//                   >
//                     Write a Review
//                   </button>
//                 )}
//               </div>
              
//               {/* Review collection UI */}
//               {reviewMode && (
//                 <div className="bcc-service-review-collection">
//                   {reviewError && (
//                     <div className="bcc-service-review-error">
//                       <p>{reviewError}</p>
//                     </div>
//                   )}
                  
//                   {reviewSuccess && (
//                     <div className="bcc-service-review-success">
//                       <p>Thank you for your review! It has been submitted successfully.</p>
//                     </div>
//                   )}
                  
//                   {/* QR Code Scanner */}
//                   {reviewMode === 'qr' && (
//                     <div className="bcc-service-qr-scanner">
//                       <h3>Scan Service QR Code</h3>
//                       <p>Point your camera at the QR code displayed at the service location</p>
//                       <QRCodeScanner onResult={handleQRResult} onCancel={() => setReviewMode(null)} />
//                     </div>
//                   )}
                  
//                   {/* Service Code Entry */}
//                   {reviewMode === 'code' && (
//                     <div className="bcc-service-code-entry">
//                       <h3>Enter Service Code</h3>
//                       <p>Enter the service code displayed at the service location</p>
//                       <div className="bcc-service-code-input-group">
//                         <input
//                           type="text"
//                           name="serviceCode"
//                           value={newReview.serviceCode}
//                           onChange={handleReviewChange}
//                           placeholder="e.g. S12345"
//                           className="bcc-service-code-input"
//                         />
//                         <button 
//                           className="bcc-service-code-submit"
//                           onClick={handleCodeSubmit}
//                         >
//                           Submit
//                         </button>
//                       </div>
//                     </div>
//                   )}
                  
//                   {/* Plate Number Entry for Transport */}
//                   {reviewMode === 'plate' && (
//                     <div className="bcc-service-plate-entry">
//                       <h3>Enter License Plate</h3>
//                       <p>Enter the license plate of the vehicle you serviced</p>
//                       <div className="bcc-service-plate-input-group">
//                         <input
//                           type="text"
//                           name="plateNumber"
//                           value={newReview.plateNumber}
//                           onChange={handleReviewChange}
//                           placeholder="e.g. ABC123"
//                           className="bcc-service-plate-input"
//                         />
//                         <button 
//                           className="bcc-service-plate-submit"
//                           onClick={handlePlateSubmit}
//                         >
//                           Submit
//                         </button>
//                       </div>
//                     </div>
//                   )}
                  
//                   {/* Write Review Form */}
//                   {reviewMode === 'write' && (
//                     <div className="bcc-service-write-review-form">
//                       <h3>Write Your Review</h3>
                      
//                       <form onSubmit={handleSubmitReview}>
//                         <div className="bcc-service-review-rating-field">
//                           <label>Your Rating</label>
//                           <div className="bcc-service-rating-input">
//                             <StarRating 
//                               rating={newReview.rating} 
//                               onRatingChange={handleRatingChange} 
//                               editable={true}
//                             />
//                           </div>
//                         </div>
                        
//                         <div className="bcc-service-review-content-field">
//                           <label>Your Review</label>
//                           <textarea
//                             name="content"
//                             value={newReview.content}
//                             onChange={handleReviewChange}
//                             placeholder="Share your experience with this service provider..."
//                             rows={5}
//                             className="bcc-service-review-content"
//                           ></textarea>
//                         </div>
                        
//                         <div className="bcc-service-review-anonymous-field">
//                           <label>
//                             <input
//                               type="checkbox"
//                               name="anonymous"
//                               checked={newReview.anonymous}
//                               onChange={handleReviewChange}
//                             />
//                             Post anonymously
//                           </label>
//                         </div>
                        
//                         <div className="bcc-service-review-actions">
//                           <button 
//                             type="submit" 
//                             className="bcc-service-submit-review-button"
//                             disabled={reviewSubmitting}
//                           >
//                             {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
//                           </button>
//                         </div>
//                       </form>
//                     </div>
//                   )}
                  
//                   {/* Review Collection Methods - displayed when starting a review */}
//                   {reviewMode === null && (
//                     <div className="bcc-service-review-methods">
//                       <h3>How would you like to review?</h3>
//                       <div className="bcc-service-review-method-buttons">
//                         <button onClick={handleScanQR} className="bcc-service-review-method-button">
//                           <span className="bcc-service-review-method-icon">📷</span>
//                           Scan QR Code
//                         </button>
//                         <button onClick={handleServiceCode} className="bcc-service-review-method-button">
//                           <span className="bcc-service-review-method-icon">🔢</span>
//                           Use Service Code
//                         </button>
//                         <button onClick={handlePlateNumber} className="bcc-service-review-method-button">
//                           <span className="bcc-service-review-method-icon">🚗</span>
//                           Use Number Plate
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}
              
//               {/* Review Listing */}
//               {!reviewMode && (
//                 <>
//                   {reviewsLoading ? (
//                     <div className="bcc-service-loading-container">
//                       <div className="bcc-service-spinner"></div>
//                     </div>
//                   ) : reviews.length === 0 ? (
//                     <div className="bcc-service-no-reviews">
//                       <p>No reviews yet. Be the first to review this service provider!</p>
//                       <div className="bcc-service-review-methods">
//                         <h3>How would you like to review?</h3>
//                         <div className="bcc-service-review-method-buttons">
//                           <button onClick={handleScanQR} className="bcc-service-review-method-button">
//                             <span className="bcc-service-review-method-icon">📷</span>
//                             Scan QR Code
//                           </button>
//                           <button onClick={handleServiceCode} className="bcc-service-review-method-button">
//                             <span className="bcc-service-review-method-icon">🔢</span>
//                             Use Service Code
//                           </button>
//                           <button onClick={handlePlateNumber} className="bcc-service-review-method-button">
//                             <span className="bcc-service-review-method-icon">🚗</span>
//                             Use Number Plate
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="bcc-service-reviews-list">
//                       {reviews.map(review => (
//                         <div className="bcc-service-review-item" key={review._id}>
//                           <div className="bcc-service-review-header">
//                             <div className="bcc-service-review-user">
//                               {review.anonymous ? (
//                                 <span className="bcc-service-review-anonymous">Anonymous</span>
//                               ) : (
//                                 <span className="bcc-service-review-username">{review.user?.name || 'User'}</span>
//                               )}
//                             </div>
//                             <div className="bcc-service-review-date">
//                               {formatReviewDate(review.createdAt)}
//                             </div>
//                           </div>
                          
//                           <div className="bcc-service-review-rating">
//                             <StarRating rating={review.rating} editable={false} />
//                           </div>
                          
//                           {review.content && (
//                             <div className="bcc-service-review-content">
//                               <p>{review.content}</p>
//                             </div>
//                           )}
                          
//                           {review.reply && (
//                             <div className="bcc-service-review-reply">
//                               <div className="bcc-service-reply-header">
//                                 <span className="bcc-service-reply-label">Response from the provider</span>
//                               </div>
//                               <p>{review.reply}</p>
//                             </div>
//                           )}
//                         </div>
//                       ))}
                      
//                       {/* Reviews Pagination */}
//                       {reviewsPagination.totalPages > 1 && (
//                         <div className="bcc-service-pagination">
//                           <button 
//                             className="bcc-service-page-button prev" 
//                             onClick={() => setReviewsPage(reviewsPagination.currentPage - 1)}
//                             disabled={reviewsPagination.currentPage === 1}
//                           >
//                             Previous
//                           </button>
                          
//                           {Array.from({ length: Math.min(5, reviewsPagination.totalPages) }).map((_, index) => {
//                             // Calculate which pages to show
//                             let pageToShow;
//                             if (reviewsPagination.totalPages <= 5) {
//                               pageToShow = index + 1;
//                             } else if (reviewsPagination.currentPage <= 3) {
//                               pageToShow = index + 1;
//                             } else if (reviewsPagination.currentPage >= reviewsPagination.totalPages - 2) {
//                               pageToShow = reviewsPagination.totalPages - 4 + index;
//                             } else {
//                               pageToShow = reviewsPagination.currentPage - 2 + index;
//                             }
                            
//                             return (
//                               <button
//                                 key={pageToShow}
//                                 className={`bcc-service-page-number ${reviewsPagination.currentPage === pageToShow ? 'active' : ''}`}
//                                 onClick={() => setReviewsPage(pageToShow)}
//                               >
//                                 {pageToShow}
//                               </button>
//                             );
//                           })}
                          
//                           <button 
//                             className="bcc-service-page-button next" 
//                             onClick={() => setReviewsPage(reviewsPagination.currentPage + 1)}
//                             disabled={reviewsPagination.currentPage === reviewsPagination.totalPages}
//                           >
//                             Next
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           )}
          
//           {activeTab === 'contact' && (
//             <div className="bcc-service-contact-tab">
//               <h2>Contact {service.businessName}</h2>
              
//               <div className="bcc-service-contact-grid">
//                 <div className="bcc-service-contact-info">
//                   <h3>Contact Information</h3>
                  
//                   <div className="bcc-service-contact-details">
//                     {service.contact?.phone && (
//                       <div className="bcc-service-contact-detail">
//                         <div className="bcc-service-detail-label">Phone</div>
//                         <div className="bcc-service-detail-value">
//                           <a href={`tel:${service.contact.phone}`}>{service.contact.phone}</a>
//                         </div>
//                       </div>
//                     )}
                    
//                     {service.contact?.email && (
//                       <div className="bcc-service-contact-detail">
//                         <div className="bcc-service-detail-label">Email</div>
//                         <div className="bcc-service-detail-value">
//                           <a href={`mailto:${service.contact.email}`}>{service.contact.email}</a>
//                         </div>
//                       </div>
//                     )}
                    
//                     {service.contact?.website && (
//                       <div className="bcc-service-contact-detail">
//                         <div className="bcc-service-detail-label">Website</div>
//                         <div className="bcc-service-detail-value">
//                           <a 
//                             href={service.contact.website.startsWith('http') ? service.contact.website : `https://${service.contact.website}`} 
//                             target="_blank" 
//                             rel="noopener noreferrer"
//                           >
//                             {service.contact.website}
//                           </a>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
                
//                 <div className="bcc-service-contact-location">
//                   <h3>Location</h3>
                  
//                   <div className="bcc-service-location-details">
//                     {service.location?.address && (
//                       <div className="bcc-service-address">
//                         <p>{service.location.address}</p>
//                         <p>
//                           {service.location.city}{service.location.state ? `, ${service.location.state}` : ''}
//                           {service.location.country ? `, ${service.location.country}` : ''}
//                         </p>
//                       </div>
//                     )}
                    
//                     {/* Placeholder for map (would be implemented with Google Maps API) */}
//                     <div className="bcc-service-map-placeholder">
//                       <p>Map view coming soon</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
              
//               <div className="bcc-service-contact-form-section">
//                 <h3>Send a Message</h3>
                
//                 <form className="bcc-service-contact-form">
//                   <div className="bcc-service-form-row">
//                     <div className="bcc-service-form-group">
//                       <label htmlFor="name">Your Name</label>
//                       <input type="text" id="name" name="name" />
//                     </div>
                    
//                     <div className="bcc-service-form-group">
//                       <label htmlFor="email">Your Email</label>
//                       <input type="email" id="email" name="email" />
//                     </div>
//                   </div>
                  
//                   <div className="bcc-service-form-group">
//                     <label htmlFor="subject">Subject</label>
//                     <input type="text" id="subject" name="subject" />
//                   </div>
                  
//                   <div className="bcc-service-form-group">
//                     <label htmlFor="message">Message</label>
//                     <textarea id="message" name="message" rows="5"></textarea>
//                   </div>
                  
//                   <div className="bcc-service-form-submit">
//                     <button type="submit" className="bcc-service-send-message-button">
//                       Send Message
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
      
//       {/* Share Modal Component */}
//       {shareModalOpen && (
//         <ShareModal 
//           car={null}
//           service={selectedService}
//           serviceProvider={sharingService ? service : null}
//           onClose={() => setShareModalOpen(false)}
//           buttonRef={shareButtonRef}
//         />
//       )}
//     </div>
//   );
// };

// export default ServiceDetailPage;