const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('SubSpace Design Evaluation', async ({ page }) => {
  console.log('=== SubSpace Design Evaluation ===\n');

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'design-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Navigate to the site
  console.log('Navigating to https://subspace.deacon.build...');
  await page.goto('https://subspace.deacon.build', { waitUntil: 'networkidle' });

  // Take initial full page screenshot
  await page.screenshot({
    path: path.join(screenshotsDir, '01-full-page.png'),
    fullPage: true
  });
  console.log('✓ Full page screenshot captured\n');

  // Get viewport size
  const viewport = page.viewportSize();
  console.log(`Viewport: ${viewport.width}x${viewport.height}\n`);

  // ===== PAGE STRUCTURE =====
  console.log('=== PAGE STRUCTURE ===');
  const title = await page.title();
  console.log(`Page Title: ${title}`);

  const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
    elements.map(el => ({
      tag: el.tagName,
      text: el.textContent.trim(),
      visible: el.offsetParent !== null
    }))
  );
  console.log('\nHeadings:');
  headings.forEach(h => {
    if (h.visible) console.log(`  ${h.tag}: ${h.text}`);
  });

  // ===== COLOR SCHEME =====
  console.log('\n=== COLOR SCHEME ===');
  const colors = await page.evaluate(() => {
    const getComputedColors = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        background: styles.backgroundColor,
        color: styles.color,
        borderColor: styles.borderColor
      };
    };

    return {
      body: getComputedColors('body'),
      header: getComputedColors('header'),
      mainContent: getComputedColors('main'),
      buttons: Array.from(document.querySelectorAll('button')).slice(0, 3).map(btn => ({
        text: btn.textContent.trim(),
        background: window.getComputedStyle(btn).backgroundColor,
        color: window.getComputedStyle(btn).color
      })),
      links: Array.from(document.querySelectorAll('a')).slice(0, 3).map(link => ({
        text: link.textContent.trim(),
        color: window.getComputedStyle(link).color
      }))
    };
  });
  console.log(JSON.stringify(colors, null, 2));

  // ===== TYPOGRAPHY =====
  console.log('\n=== TYPOGRAPHY ===');
  const typography = await page.evaluate(() => {
    const getFontInfo = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        fontFamily: styles.fontFamily,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight,
        letterSpacing: styles.letterSpacing
      };
    };

    return {
      body: getFontInfo('body'),
      h1: getFontInfo('h1'),
      h2: getFontInfo('h2'),
      h3: getFontInfo('h3'),
      paragraph: getFontInfo('p'),
      button: getFontInfo('button')
    };
  });
  console.log(JSON.stringify(typography, null, 2));

  // ===== LAYOUT & SPACING =====
  console.log('\n=== LAYOUT & SPACING ===');
  const layout = await page.evaluate(() => {
    const body = document.body;
    const bodyStyles = window.getComputedStyle(body);

    const main = document.querySelector('main');
    const mainStyles = main ? window.getComputedStyle(main) : null;

    return {
      bodyMargin: bodyStyles.margin,
      bodyPadding: bodyStyles.padding,
      mainPadding: mainStyles ? mainStyles.padding : 'N/A',
      mainMaxWidth: mainStyles ? mainStyles.maxWidth : 'N/A',
      mainWidth: mainStyles ? mainStyles.width : 'N/A'
    };
  });
  console.log(JSON.stringify(layout, null, 2));

  // ===== BUTTONS & CTA =====
  console.log('\n=== BUTTONS & CALL-TO-ACTION ===');
  const buttons = await page.$$eval('button, a.button, a[role="button"], input[type="submit"]', elements =>
    elements.map(el => ({
      type: el.tagName,
      text: el.textContent.trim() || el.value,
      visible: el.offsetParent !== null,
      classes: el.className
    }))
  );
  console.log('Buttons found:');
  buttons.forEach((btn, i) => {
    if (btn.visible) console.log(`  ${i + 1}. [${btn.type}] ${btn.text} (${btn.classes})`);
  });

  // Take screenshot of button area
  const mainButton = await page.$('button, a.button, a[role="button"]');
  if (mainButton) {
    await mainButton.screenshot({
      path: path.join(screenshotsDir, '02-button-detail.png')
    });
  }

  // ===== NAVIGATION =====
  console.log('\n=== NAVIGATION ===');
  const navigation = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    const header = document.querySelector('header');

    return {
      hasNav: !!nav,
      hasHeader: !!header,
      navLinks: nav ? Array.from(nav.querySelectorAll('a')).map(a => a.textContent.trim()) : [],
      headerContent: header ? header.textContent.trim().substring(0, 200) : 'N/A'
    };
  });
  console.log(JSON.stringify(navigation, null, 2));

  // ===== IMAGES & ICONS =====
  console.log('\n=== IMAGES & VISUAL ELEMENTS ===');
  const images = await page.$$eval('img, svg', elements =>
    elements.map(el => ({
      type: el.tagName,
      src: el.src || 'inline SVG',
      alt: el.alt || 'N/A',
      width: el.width || el.clientWidth,
      height: el.height || el.clientHeight,
      visible: el.offsetParent !== null
    }))
  );
  console.log(`Total images/icons: ${images.filter(img => img.visible).length}`);
  images.filter(img => img.visible).forEach((img, i) => {
    console.log(`  ${i + 1}. ${img.type} - ${img.width}x${img.height} - ${img.alt}`);
  });

  // ===== ACCESSIBILITY =====
  console.log('\n=== ACCESSIBILITY ===');
  const a11y = await page.evaluate(() => {
    return {
      hasLang: document.documentElement.hasAttribute('lang'),
      langValue: document.documentElement.getAttribute('lang'),
      hasSkipLinks: !!document.querySelector('a[href="#main"], a[href="#content"]'),
      ariaLabels: document.querySelectorAll('[aria-label]').length,
      ariaDescribedBy: document.querySelectorAll('[aria-describedby]').length,
      formLabels: document.querySelectorAll('label').length,
      formInputs: document.querySelectorAll('input, textarea, select').length,
      altTexts: Array.from(document.querySelectorAll('img')).filter(img => img.alt).length,
      totalImages: document.querySelectorAll('img').length
    };
  });
  console.log(JSON.stringify(a11y, null, 2));

  // ===== RESPONSIVE DESIGN =====
  console.log('\n=== RESPONSIVE DESIGN ===');

  // Test mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(screenshotsDir, '03-mobile-375.png'),
    fullPage: true
  });
  console.log('✓ Mobile (375px) screenshot captured');

  // Test tablet view
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(screenshotsDir, '04-tablet-768.png'),
    fullPage: true
  });
  console.log('✓ Tablet (768px) screenshot captured');

  // Test desktop view
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(screenshotsDir, '05-desktop-1920.png'),
    fullPage: true
  });
  console.log('✓ Desktop (1920px) screenshot captured');

  // Check for viewport meta tag
  const viewportMeta = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    return meta ? meta.getAttribute('content') : 'Not found';
  });
  console.log(`Viewport meta tag: ${viewportMeta}`);

  // ===== PERFORMANCE & LOADING =====
  console.log('\n=== PERFORMANCE ===');
  const performance = await page.evaluate(() => {
    const perf = window.performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: Math.round(perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart),
      loadComplete: Math.round(perf.loadEventEnd - perf.loadEventStart),
      domInteractive: Math.round(perf.domInteractive - perf.fetchStart)
    };
  });
  console.log(JSON.stringify(performance, null, 2));

  // ===== CONTENT ANALYSIS =====
  console.log('\n=== CONTENT ANALYSIS ===');
  const content = await page.evaluate(() => {
    const getText = (selector) => {
      const el = document.querySelector(selector);
      return el ? el.textContent.trim() : 'Not found';
    };

    return {
      paragraphCount: document.querySelectorAll('p').length,
      listCount: document.querySelectorAll('ul, ol').length,
      totalTextLength: document.body.textContent.trim().length,
      hasHero: !!document.querySelector('.hero, [class*="hero"]'),
      hasFooter: !!document.querySelector('footer'),
      formCount: document.querySelectorAll('form').length
    };
  });
  console.log(JSON.stringify(content, null, 2));

  console.log('\n=== Design Evaluation Complete ===');
  console.log(`Screenshots saved to: ${screenshotsDir}`);
});
