# SynergyOS Website

A modern, dark gaming-focused website for SynergyOS - the optimized Windows playbook for gamers.

## Overview

SynergyOS is a completely redesigned Windows experience that delivers:
- **Modern Dark Design** - Built for gamers, not office PCs
- **Performance** - Real FPS gains through scheduling, memory, kernel, GPU & CPU tuning
- **Privacy** - Telemetry and tracking neutralized at the source
- **Customization** - Full control over what stays and what goes
- **Convenience** - Apply as a playbook with no fresh install required
- **Pre-bundled** - VCRedist + DirectX included

## File Structure

```
Synergy Website/
├── index.html          # Main website HTML structure
├── styles.css          # All styling and responsive design
├── script.js           # Interactive features and animations
└── README.md           # This file
```

## Features

### Logo Placeholder
The logo placeholder is located in the top-left navigation bar. You can update it in three ways:

1. **Drag & Drop**: Drag an image file directly onto the gradient placeholder box
2. **Click to Upload**: Click the placeholder box to open a file browser and select an image
3. **Replace in Code**: Edit `index.html` and replace the logo-placeholder div with your own image tag

The placeholder is clearly marked in `index.html` with a comment:
```html
<!-- LOGO PLACEHOLDER - Drag and drop your logo here -->
```

### Design Elements

 - **Color Scheme**: Purple (#7C4DFF) and Lavender (#B388FF) accents on dark backgrounds
- **Typography**: Modern sans-serif with gradient text effects
- **Animations**: Smooth transitions, hover effects, and scroll-triggered animations
- **Responsive**: Works on desktop, tablet, and mobile devices

### Sections

1. **Navigation Bar** - Sticky header with logo and menu links
2. **Hero Section** - Main headline with CTA buttons and visual effects
3. **Features Grid** - 6 key features with icons and descriptions
4. **How It Works** - 4-step process visualization
5. **Stats Section** - Key metrics and impressive numbers
6. **Call-to-Action** - Final push to get started
7. **Footer** - Links and copyright information

## Customization

### Colors
Edit the CSS variables at the top of `styles.css`:
```css
:root {
    --primary-color: #7C4DFF;      /* Purple accent */
    --secondary-color: #B388FF;    /* Lavender accent */
    --dark-bg: #071022;            /* Main background */
    /* ... more variables ... */
}
```

### Content
All text is in `index.html`. Simply edit the HTML content to update:
- Headlines and descriptions
- Feature text
- Button labels
- Footer links

### Fonts
Modify the font family in `styles.css`:
```css
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
```

## Features Included

✅ Modern dark gaming aesthetic  
✅ Fully responsive design (mobile, tablet, desktop)  
✅ Logo drag-and-drop functionality  
✅ Smooth scroll animations  
✅ Hover effects on interactive elements  
✅ Gradient text and accent colors  
✅ Professional button styling  
✅ Organized feature cards  
✅ Stats showcase section  
✅ Mobile-optimized navigation  

## How to Use

1. **Logo Setup**: Open the website in a browser, then drag your SynergyOS logo onto the placeholder or click it to upload
2. **Local Development**: Open `index.html` in any modern web browser
3. **Deployment**: Upload all three files (index.html, styles.css, script.js) to your web hosting

## Browser Support

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Next Steps

- [ ] Add your SynergyOS logo to the placeholder
- [ ] Update social media links in footer
- [ ] Configure email/contact forms for CTAs
- [ ] Add documentation pages
- [ ] Set up analytics
- [ ] Deploy to web server

## Notes

- All animations are GPU-accelerated for smooth performance
- The design uses CSS Grid and Flexbox for layout
- JavaScript includes intersection observer for scroll animations
- Logo placeholder supports drag-and-drop for easy updates

---

Built for SynergyOS • May 2026
