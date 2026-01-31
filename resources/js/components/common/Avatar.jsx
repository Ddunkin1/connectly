const Avatar = ({ src, alt, size = 'md', className = '' }) => {
    const sizeClasses = {
        xs: 'w-6 h-6',
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
        '2xl': 'w-20 h-20',
    };

    return (
        <div
            className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-600 flex items-center justify-center flex-shrink-0 ${className}`}
        >
            {src ? (
                <img src={src} alt={alt || 'Avatar'} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold">
                    {alt?.[0]?.toUpperCase() || '?'}
                </div>
            )}
        </div>
    );
};

export default Avatar;
