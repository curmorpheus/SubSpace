import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Apple Design Principles Evaluation - Post-Redesign', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://subspace.deacon.build');
    await page.waitForLoadState('networkidle');
  });

  test('Full Design Evaluation', async ({ page }) => {
    console.log('\n=== APPLE DESIGN PRINCIPLES EVALUATION ===\n');

    const screenshotsDir = path.join(__dirname, '../../evaluation-screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Take full page screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '01-full-page.png'),
      fullPage: true
    });
    console.log('✓ Captured full page screenshot');

    // 1. TYPOGRAPHY EVALUATION
    console.log('\n--- TYPOGRAPHY EVALUATION ---');

    const bodyFont = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).fontFamily;
    });
    console.log(`Body Font: ${bodyFont}`);
    const usesInter = bodyFont.toLowerCase().includes('inter');
    console.log(`Uses Inter: ${usesInter ? '✓ YES' : '✗ NO'}`);

    // Check all text elements for font consistency
    const allFonts = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const fonts = new Set<string>();
      elements.forEach(el => {
        const font = window.getComputedStyle(el).fontFamily;
        if (font) fonts.add(font);
      });
      return Array.from(fonts);
    });
    console.log(`Total unique fonts found: ${allFonts.length}`);
    console.log('Fonts in use:', allFonts);

    // Check heading hierarchy
    const headings = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const h2 = document.querySelector('h2');
      const h3 = document.querySelector('h3');
      return {
        h1: h1 ? {
          text: h1.textContent?.trim(),
          fontSize: window.getComputedStyle(h1).fontSize,
          fontWeight: window.getComputedStyle(h1).fontWeight,
          lineHeight: window.getComputedStyle(h1).lineHeight,
        } : null,
        h2: h2 ? {
          text: h2.textContent?.trim(),
          fontSize: window.getComputedStyle(h2).fontSize,
          fontWeight: window.getComputedStyle(h2).fontWeight,
        } : null,
        h3: h3 ? {
          text: h3.textContent?.trim(),
          fontSize: window.getComputedStyle(h3).fontSize,
          fontWeight: window.getComputedStyle(h3).fontWeight,
        } : null
      };
    });
    console.log('Heading Hierarchy:', JSON.stringify(headings, null, 2));

    // 2. COLOR EVALUATION
    console.log('\n--- COLOR EVALUATION ---');

    const colorUsage = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const colors = {
        backgrounds: new Set<string>(),
        textColors: new Set<string>(),
        borderColors: new Set<string>(),
        buttonColors: new Set<string>()
      };

      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          colors.backgrounds.add(styles.backgroundColor);
        }
        if (styles.color) {
          colors.textColors.add(styles.color);
        }
        if (styles.borderColor && styles.borderColor !== 'rgba(0, 0, 0, 0)') {
          colors.borderColors.add(styles.borderColor);
        }
        if (el.tagName === 'BUTTON') {
          colors.buttonColors.add(styles.backgroundColor);
          colors.buttonColors.add(styles.color);
        }
      });

      return {
        backgrounds: Array.from(colors.backgrounds),
        textColors: Array.from(colors.textColors),
        borderColors: Array.from(colors.borderColors),
        buttonColors: Array.from(colors.buttonColors)
      };
    });

    console.log('Background colors:', colorUsage.backgrounds);
    console.log('Text colors:', colorUsage.textColors);
    console.log('Border colors:', colorUsage.borderColors);
    console.log('Button colors:', colorUsage.buttonColors);

    // Check for purple/green (should be removed)
    const hasPurple = colorUsage.backgrounds.some(c => c.includes('purple') || c.includes('128, 0, 128')) ||
                     colorUsage.textColors.some(c => c.includes('purple'));
    const hasGreen = colorUsage.backgrounds.some(c => c.includes('green') || c.includes('0, 128, 0')) ||
                    colorUsage.textColors.some(c => c.includes('green'));
    console.log(`Contains purple: ${hasPurple ? '✗ YES (should remove)' : '✓ NO'}`);
    console.log(`Contains green: ${hasGreen ? '✗ YES (should remove)' : '✓ NO'}`);

    // 3. WHITE SPACE EVALUATION
    console.log('\n--- WHITE SPACE EVALUATION ---');

    const spacing = await page.evaluate(() => {
      const container = document.querySelector('main') || document.body;
      const sections = container.querySelectorAll('section, div[class*="container"]');
      const spacingData: any[] = [];

      sections.forEach((section, idx) => {
        const styles = window.getComputedStyle(section);
        spacingData.push({
          index: idx,
          padding: styles.padding,
          margin: styles.margin,
          gap: styles.gap
        });
      });

      return spacingData;
    });
    console.log('Section spacing:', JSON.stringify(spacing, null, 2));

    // 4. EMOJI AND DECORATIONS CHECK
    console.log('\n--- EMOJI & DECORATIONS CHECK ---');

    const decorativeElements = await page.evaluate(() => {
      const body = document.body;
      const allText = body.innerText;

      // Check for emoji using regex
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
      const emojis = allText.match(emojiRegex) || [];

      // Check for background decorations
      const decorativeImages = Array.from(document.querySelectorAll('img')).filter(img =>
        img.alt?.toLowerCase().includes('decoration') ||
        img.className?.toLowerCase().includes('decoration') ||
        img.className?.toLowerCase().includes('emoji')
      );

      // Check for absolutely positioned elements (often decorations)
      const absoluteElements = Array.from(document.querySelectorAll('*')).filter(el => {
        return window.getComputedStyle(el).position === 'absolute';
      }).map(el => ({
        tag: el.tagName,
        className: el.className,
        text: el.textContent?.slice(0, 50)
      }));

      return {
        emojiCount: emojis.length,
        emojis: emojis,
        decorativeImages: decorativeImages.length,
        absoluteElements: absoluteElements
      };
    });

    console.log(`Emoji found: ${decorativeElements.emojiCount}`);
    console.log(`Emojis:`, decorativeElements.emojis);
    console.log(`Decorative images: ${decorativeElements.decorativeImages}`);
    console.log(`Absolutely positioned elements:`, decorativeElements.absoluteElements);

    // 5. FORM CARD EVALUATION
    console.log('\n--- FORM CARD EVALUATION ---');

    await page.screenshot({
      path: path.join(screenshotsDir, '02-form-card.png')
    });

    const formCardStyles = await page.evaluate(() => {
      const formCard = document.querySelector('form')?.closest('div[class*="card"], div[class*="container"]');
      if (!formCard) return null;

      const styles = window.getComputedStyle(formCard);
      return {
        backgroundColor: styles.backgroundColor,
        boxShadow: styles.boxShadow,
        borderRadius: styles.borderRadius,
        padding: styles.padding,
        border: styles.border
      };
    });
    console.log('Form card styles:', JSON.stringify(formCardStyles, null, 2));

    // 6. BUTTON EVALUATION
    console.log('\n--- BUTTON EVALUATION ---');

    const buttons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.map(btn => ({
        text: btn.textContent?.trim(),
        backgroundColor: window.getComputedStyle(btn).backgroundColor,
        color: window.getComputedStyle(btn).color,
        padding: window.getComputedStyle(btn).padding,
        borderRadius: window.getComputedStyle(btn).borderRadius,
        fontSize: window.getComputedStyle(btn).fontSize,
        fontWeight: window.getComputedStyle(btn).fontWeight,
        boxShadow: window.getComputedStyle(btn).boxShadow
      }));
    });
    console.log('Buttons:', JSON.stringify(buttons, null, 2));

    // Check button hover state
    const submitButton = page.locator('button').filter({ hasText: 'Fill Out Form Now' }).first();
    if (await submitButton.isVisible()) {
      await submitButton.hover();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(screenshotsDir, '03-button-hover.png')
      });
      console.log('✓ Captured button hover state');
    }

    // 7. ANIMATION EVALUATION
    console.log('\n--- ANIMATION EVALUATION ---');

    const animations = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const animatedElements: any[] = [];

      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.animation !== 'none' && styles.animation !== '') {
          animatedElements.push({
            tag: el.tagName,
            className: el.className,
            animation: styles.animation,
            transition: styles.transition
          });
        }
      });

      return animatedElements;
    });
    console.log('Animated elements:', JSON.stringify(animations, null, 2));

    // 8. MOBILE RESPONSIVENESS
    console.log('\n--- MOBILE RESPONSIVENESS ---');

    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotsDir, '04-mobile-view.png'),
      fullPage: true
    });

    const mobileStyles = await page.evaluate(() => {
      const container = document.querySelector('main') || document.body;
      const styles = window.getComputedStyle(container);
      return {
        padding: styles.padding,
        maxWidth: styles.maxWidth
      };
    });
    console.log('Mobile container styles:', mobileStyles);

    await page.setViewportSize({ width: 1920, height: 1080 }); // Back to desktop
    await page.waitForTimeout(500);

    // 9. LOGO/WORDMARK EVALUATION
    console.log('\n--- LOGO/WORDMARK EVALUATION ---');

    const logo = await page.evaluate(() => {
      const logoElement = document.querySelector('img[alt*="logo"], img[alt*="SubSpace"], h1');
      if (!logoElement) return null;

      const styles = window.getComputedStyle(logoElement);
      return {
        tag: logoElement.tagName,
        text: logoElement.textContent?.trim(),
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        color: styles.color,
        src: logoElement.tagName === 'IMG' ? (logoElement as HTMLImageElement).src : null
      };
    });
    console.log('Logo/Wordmark:', JSON.stringify(logo, null, 2));

    // 10. SHADOW EVALUATION
    console.log('\n--- SHADOW EVALUATION ---');

    const shadows = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const shadowElements: any[] = [];

      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.boxShadow !== 'none' && styles.boxShadow !== '') {
          shadowElements.push({
            tag: el.tagName,
            className: el.className,
            boxShadow: styles.boxShadow
          });
        }
      });

      return shadowElements;
    });
    console.log('Elements with shadows:', JSON.stringify(shadows, null, 2));

    // 11. CONTENT HIERARCHY
    console.log('\n--- CONTENT HIERARCHY ---');

    const hierarchy = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      const structure: any[] = [];

      const topLevelChildren = main.children;
      Array.from(topLevelChildren).forEach((child, idx) => {
        const styles = window.getComputedStyle(child);
        structure.push({
          index: idx,
          tag: child.tagName,
          className: child.className,
          textContent: child.textContent?.trim().slice(0, 100),
          display: styles.display,
          marginTop: styles.marginTop,
          marginBottom: styles.marginBottom
        });
      });

      return structure;
    });
    console.log('Content hierarchy:', JSON.stringify(hierarchy, null, 2));

    // 12. BACKGROUND EVALUATION
    console.log('\n--- BACKGROUND EVALUATION ---');

    const background = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        backgroundColor: styles.backgroundColor,
        backgroundImage: styles.backgroundImage,
        backgroundSize: styles.backgroundSize,
        backgroundRepeat: styles.backgroundRepeat
      };
    });
    console.log('Background:', JSON.stringify(background, null, 2));

    // 13. INPUT FIELD EVALUATION
    console.log('\n--- INPUT FIELD EVALUATION ---');

    const inputs = await page.evaluate(() => {
      const inputElements = Array.from(document.querySelectorAll('input, textarea, select'));
      return inputElements.map(input => {
        const styles = window.getComputedStyle(input);
        return {
          type: (input as HTMLInputElement).type || input.tagName,
          placeholder: (input as HTMLInputElement).placeholder,
          fontSize: styles.fontSize,
          padding: styles.padding,
          borderRadius: styles.borderRadius,
          border: styles.border,
          backgroundColor: styles.backgroundColor
        };
      }).slice(0, 5); // First 5 inputs
    });
    console.log('Input fields:', JSON.stringify(inputs, null, 2));

    // Take final screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '05-final-state.png'),
      fullPage: true
    });

    console.log('\n=== EVALUATION COMPLETE ===');
    console.log(`Screenshots saved to: ${screenshotsDir}`);
  });
});
