// Add to components/shared/LazyLoadComponent.js
const LazyLoadComponent = ({ children, threshold = 0.5 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const componentRef = useRef();
  
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold }
      );
  
      if (componentRef.current) {
        observer.observe(componentRef.current);
      }
  
      return () => observer.disconnect();
    }, []);
  
    return (
      <div ref={componentRef}>
        {isVisible ? children : <div style={{ height: '200px' }} />}
      </div>
    );
  };