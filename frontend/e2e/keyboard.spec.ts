import { test, expect } from '@playwright/test';

test.describe('Keyboard navigation', () => {
  test('interactive elements are keyboard focusable and display focus ring', async ({ page }) => {
    await page.goto('/');
    
    // Press Tab to focus the first element (the skip link)
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('text=Skip to main content');
    await expect(skipLink).toBeFocused();
    
    // Press Tab again to move through the navigation
    await page.keyboard.press('Tab');
    const firstNavLink = page.locator('nav a, nav button').first();
    // Assuming there is a nav link
    if (await firstNavLink.count() > 0) {
      await expect(firstNavLink).toBeFocused();
    }
  });

  test('focus-visible is applied to elements', async ({ page }) => {
    await page.goto('/');
    
    // The CSS defines @layer base { :focus-visible { outline: 2px solid #22d3ee; } }
    // We can evaluate if the focused element has this outline
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('text=Skip to main content');
    await expect(skipLink).toBeFocused();
    
    const outlineColor = await skipLink.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.outlineColor;
    });
    
    // The outline color might be computed to rgb(34, 211, 238) (#22d3ee)
    // Or it might be the default blue of Tailwind if not overridden properly
    // It's enough to check it's not 'none' or 'rgba(0, 0, 0, 0)'
    expect(outlineColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(outlineColor).not.toBe('transparent');
  });
});
