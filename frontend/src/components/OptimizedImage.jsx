import React, { useState } from 'react';
import s3Service from '../services/s3Service';
import './OptimizedImage.css';

const OptimizedImage = ({
    src,
    alt,
    className = '',
    size = 'medium',
    loading = 'lazy',
    fallback = '/placeholder-image.jpg',
    ...props
}) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    if (!src || imageError) {
        return (
            <img
                src={fallback}
                alt={alt}
                className={`optimized-image ${className} ${imageLoaded ? 'loaded' : 'loading'}`}
                loading={loading}
                {...props}
            />
        );
    }

    // Get responsive image sources
    const { src: fallbackSrc, srcSet, sizes } = s3Service.getResponsiveImageSources(src);

    return (
        <picture className={`optimized-image-container ${className}`}>
            {/* WebP sources for modern browsers */}
            <source
                srcSet={srcSet}
                sizes={sizes}
                type="image/webp"
            />

            {/* Fallback JPEG for older browsers */}
            <img
                src={fallbackSrc}
                alt={alt}
                className={`optimized-image ${imageLoaded ? 'loaded' : 'loading'}`}
                loading={loading}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                {...props}
            />
        </picture>
    );
};

export default OptimizedImage;