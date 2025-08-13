import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SliderImage {
  _id?: string;
  url: string;
  alt: string;
  title?: string;
  subtitle?: string;
  isActive?: boolean;
  order?: number;
}

const HeroImageSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [images, setImages] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(true);

  // Default fallback images with more test banners
  const defaultImages: SliderImage[] = [
    {
      url: "https://cdn.builder.io/api/v1/image/assets%2Faca6a5a965b04b5a9363bc5b1febaeba%2F651710a05e4347469b07fc0a51b765c6?format=webp&width=800",
      alt: "Property showcase 1",
      title: "Find Your Perfect Property",
      subtitle: "Discover amazing properties in your area",
    },
    {
      url: "https://cdn.builder.io/api/v1/image/assets%2Faca6a5a965b04b5a9363bc5b1febaeba%2F813119609a3842cda2daba18ee7ad541?format=webp&width=800",
      alt: "Property showcase 2",
      title: "Premium Properties",
      subtitle: "Luxury homes and commercial spaces",
    },
    {
      url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
      alt: "Property showcase 3",
      title: "Your Dream Home Awaits",
      subtitle: "Browse verified listings with expert guidance",
    },
    {
      url: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop",
      alt: "Property showcase 4",
      title: "Trusted Property Partner",
      subtitle: "Professional service you can rely on",
    },
    {
      url: "https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=800&h=600&fit=crop",
      alt: "Property showcase 5",
      title: "Modern Living Spaces",
      subtitle: "Contemporary homes with all amenities",
    },
    {
      url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
      alt: "Property showcase 6",
      title: "Investment Opportunities",
      subtitle: "Prime locations for smart investors",
    },
  ];

  // Fetch slider images from admin
  useEffect(() => {
    const fetchSliderImages = async () => {
      try {
        const response = await fetch("/api/homepage-sliders");
        if (response.ok) {
          const data = await response.json();
          if (
            data.success &&
            data.data &&
            Array.isArray(data.data) &&
            data.data.length > 0
          ) {
            // Filter active slides and sort by order
            const activeSlides = data.data
              .filter((slide: SliderImage) => slide.isActive !== false)
              .sort(
                (a: SliderImage, b: SliderImage) =>
                  (a.order || 0) - (b.order || 0),
              );

            setImages(activeSlides);
            console.log(
              "✅ Slider images loaded from admin:",
              activeSlides.length,
            );
          } else {
            console.log("📂 No slider images found, using defaults");
            setImages(defaultImages);
          }
        } else {
          throw new Error("API response not ok");
        }
      } catch (error) {
        console.warn("⚠️ Failed to fetch slider images:", error);
        console.log("📂 Using default slider images");
        setImages(defaultImages);
      } finally {
        setLoading(false);
      }
    };

    fetchSliderImages();

    // Listen for admin updates
    const handleSliderUpdate = () => {
      console.log("🔄 Slider update event received, refreshing...");
      fetchSliderImages();
    };

    window.addEventListener("sliderUpdate", handleSliderUpdate);
    window.addEventListener("sliderRefresh", handleSliderUpdate);

    return () => {
      window.removeEventListener("sliderUpdate", handleSliderUpdate);
      window.removeEventListener("sliderRefresh", handleSliderUpdate);
    };
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (images.length <= 1) return; // Don't auto-slide if only one image

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  if (loading) {
    return (
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] overflow-hidden bg-gray-200 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] overflow-hidden bg-gradient-to-r from-[#C70000] to-red-600 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4">
            Find Your Perfect Property
          </h1>
          <p className="text-lg md:text-xl text-gray-200">
            Discover amazing properties in your area with verified listings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] overflow-hidden bg-gray-900">
      {/* Image Container */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={image._id || index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={image.url}
              alt={image.alt}
              className="w-full h-full object-cover object-top"
              style={{
                objectPosition: "center top",
              }}
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop";
              }}
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-2 md:mb-4 drop-shadow-lg">
            {images[currentSlide]?.title || "Find Your Perfect Property"}
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-200 mb-4 md:mb-8 drop-shadow-md max-w-2xl mx-auto">
            {images[currentSlide]?.subtitle ||
              "Discover amazing properties in your area with verified listings"}
          </p>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentSlide
                ? "bg-white scale-110"
                : "bg-white bg-opacity-50 hover:bg-opacity-75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-black bg-opacity-20">
        <div
          className="h-full bg-white bg-opacity-70 transition-all duration-5000 ease-linear"
          style={{
            width: `${((currentSlide + 1) / images.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};

export default HeroImageSlider;
