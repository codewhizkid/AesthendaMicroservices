const validateColor = (color) => {
  // Validate hex color code
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  // Validate rgb/rgba color
  const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
  const rgbaRegex = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([01]|0?\.\d+)\s*\)$/;
  
  if (typeof color !== 'string') return false;
  
  if (hexRegex.test(color)) return true;
  if (rgbRegex.test(color)) {
    const [_, r, g, b] = color.match(rgbRegex);
    return r <= 255 && g <= 255 && b <= 255;
  }
  if (rgbaRegex.test(color)) {
    const [_, r, g, b, a] = color.match(rgbaRegex);
    return r <= 255 && g <= 255 && b <= 255 && a <= 1;
  }
  return false;
};

const validateLogo = (logo) => {
  if (!logo || typeof logo !== 'object') return false;
  
  // Validate URL
  const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
  if (!logo.url || !urlRegex.test(logo.url)) return false;
  
  // Validate dimensions
  if (logo.width !== undefined) {
    if (!Number.isInteger(logo.width) || logo.width <= 0 || logo.width > 1000) return false;
  }
  if (logo.height !== undefined) {
    if (!Number.isInteger(logo.height) || logo.height <= 0 || logo.height > 1000) return false;
  }
  
  // Validate alt text
  if (!logo.alt || typeof logo.alt !== 'string' || logo.alt.length === 0) return false;
  
  return true;
};

const validateColors = (colors) => {
  if (!colors || typeof colors !== 'object') return false;
  
  const requiredColors = [
    'primary',
    'secondary',
    'accent',
    'background',
    'text',
    'link',
    'success',
    'error',
    'warning'
  ];
  
  return requiredColors.every(colorName => {
    return colors[colorName] && validateColor(colors[colorName]);
  });
};

const validateTypography = (typography) => {
  if (!typography || typeof typography !== 'object') return false;
  
  const validFontFamilies = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Times',
    'Courier New',
    'Courier',
    'Verdana',
    'Georgia',
    'Palatino',
    'Garamond',
    'Bookman',
    'Trebuchet MS',
    'Arial Black',
    'Impact'
  ];
  
  // Validate heading font
  if (!typography.headingFont || !validFontFamilies.includes(typography.headingFont)) {
    return false;
  }
  
  // Validate body font
  if (!typography.bodyFont || !validFontFamilies.includes(typography.bodyFont)) {
    return false;
  }
  
  // Validate font sizes
  const fontSizes = ['base', 'small', 'large', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  return fontSizes.every(size => {
    const value = typography[size];
    return (
      value &&
      typeof value === 'string' &&
      /^\d+(\.\d+)?(px|rem|em)$/.test(value)
    );
  });
};

const validateLayout = (layout) => {
  if (!layout || typeof layout !== 'object') return false;
  
  // Validate container width
  if (!layout.containerWidth || 
      typeof layout.containerWidth !== 'string' || 
      !/^\d+px$/.test(layout.containerWidth)) {
    return false;
  }
  
  // Validate spacing scale
  if (!Array.isArray(layout.spacingScale) || layout.spacingScale.length === 0) {
    return false;
  }
  const validSpacing = layout.spacingScale.every(space => 
    typeof space === 'string' && /^\d+(\.\d+)?(px|rem|em)$/.test(space)
  );
  if (!validSpacing) return false;
  
  // Validate border radius
  if (!layout.borderRadius || 
      typeof layout.borderRadius !== 'string' || 
      !/^\d+(\.\d+)?(px|rem|em)$/.test(layout.borderRadius)) {
    return false;
  }
  
  // Validate shadows
  if (!Array.isArray(layout.shadows) || layout.shadows.length === 0) {
    return false;
  }
  const validShadows = layout.shadows.every(shadow => 
    typeof shadow === 'string' && 
    /^(-?\d+px\s+){2,3}(-?\d+px\s+)(rgba\(\d+,\s*\d+,\s*\d+,\s*[0-1](\.\d+)?\))$/.test(shadow)
  );
  if (!validShadows) return false;
  
  return true;
};

const validateSocialLinks = (links) => {
  if (!Array.isArray(links)) return false;
  
  const validPlatforms = [
    'facebook',
    'instagram',
    'twitter',
    'linkedin',
    'youtube',
    'pinterest',
    'tiktok'
  ];
  
  return links.every(link => {
    if (!link || typeof link !== 'object') return false;
    
    // Validate platform
    if (!link.platform || !validPlatforms.includes(link.platform)) return false;
    
    // Validate URL
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
    if (!link.url || !urlRegex.test(link.url)) return false;
    
    // Validate display name
    if (!link.displayName || typeof link.displayName !== 'string' || link.displayName.length === 0) {
      return false;
    }
    
    return true;
  });
};

const validateBranding = (branding) => {
  const errors = [];
  
  if (!branding || typeof branding !== 'object') {
    errors.push('Branding settings must be an object');
    return errors;
  }

  // Validate logo
  if (branding.logo !== undefined) {
    if (!validateLogo(branding.logo)) {
      errors.push('Invalid logo configuration');
    }
  }

  // Validate colors
  if (branding.colors !== undefined) {
    if (!validateColors(branding.colors)) {
      errors.push('Invalid colors configuration');
    }
  }

  // Validate typography
  if (branding.typography !== undefined) {
    if (!validateTypography(branding.typography)) {
      errors.push('Invalid typography configuration');
    }
  }

  // Validate layout
  if (branding.layout !== undefined) {
    if (!validateLayout(branding.layout)) {
      errors.push('Invalid layout configuration');
    }
  }

  // Validate social links
  if (branding.socialLinks !== undefined) {
    if (!validateSocialLinks(branding.socialLinks)) {
      errors.push('Invalid social links configuration');
    }
  }

  // Validate custom CSS
  if (branding.customCss !== undefined) {
    if (typeof branding.customCss !== 'string') {
      errors.push('Custom CSS must be a string');
    }
  }

  return errors;
};

module.exports = {
  validateBranding
}; 