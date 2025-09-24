import { render, screen } from '@testing-library/react';
import { Logo, LogoWithText } from '../Logo';

describe('Logo Component', () => {
  describe('Logo', () => {
    it('renders the logo SVG', () => {
      render(<Logo />);

      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '32');
      expect(svg).toHaveAttribute('height', '32');
    });

    it('applies custom size', () => {
      render(<Logo size={64} />);

      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toHaveAttribute('width', '64');
      expect(svg).toHaveAttribute('height', '64');
    });

    it('applies custom className', () => {
      render(<Logo className="custom-logo" />);

      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toHaveClass('custom-logo');
    });

    it('has correct viewBox and SVG structure', () => {
      render(<Logo />);

      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
      expect(svg).toHaveAttribute('fill', 'none');

      // Check for hexagon path (background)
      const hexagon = svg.querySelector('path[stroke="#FFD700"]');
      expect(hexagon).toBeInTheDocument();
      expect(hexagon).toHaveAttribute('fill', 'transparent');
      expect(hexagon).toHaveAttribute('stroke-width', '3');
    });

    it('contains the letters F and G', () => {
      render(<Logo />);

      const svg = screen.getByRole('img', { hidden: true });

      // Check for F letter path
      const fLetter = svg.querySelector('path[d*="M30 30 L30 70"]');
      expect(fLetter).toBeInTheDocument();

      // Check for G letter path
      const gLetter = svg.querySelector('path[d*="M70 35"]');
      expect(gLetter).toBeInTheDocument();
    });

    it('contains decorative circles', () => {
      render(<Logo />);

      const svg = screen.getByRole('img', { hidden: true });
      const circles = svg.querySelectorAll('circle');

      // Should have 3 circles for decoration
      expect(circles).toHaveLength(3);

      // Main circle
      expect(circles[0]).toHaveAttribute('cx', '50');
      expect(circles[0]).toHaveAttribute('cy', '85');
      expect(circles[0]).toHaveAttribute('r', '3');
    });
  });

  describe('LogoWithText', () => {
    it('renders logo with text', () => {
      render(<LogoWithText />);

      // Check for SVG logo
      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '40'); // Default size for LogoWithText

      // Check for text
      const text = screen.getByText('FitGenius');
      expect(text).toBeInTheDocument();
    });

    it('applies custom className to container', () => {
      render(<LogoWithText className="custom-logo-text" />);

      const container = screen.getByText('FitGenius').parentElement;
      expect(container).toHaveClass('custom-logo-text');
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('items-center');
      expect(container).toHaveClass('gap-2');
    });

    it('text has gradient styling', () => {
      render(<LogoWithText />);

      const text = screen.getByText('FitGenius');
      expect(text).toHaveClass('text-2xl');
      expect(text).toHaveClass('font-bold');
      expect(text).toHaveClass('bg-gradient-to-r');
      expect(text).toHaveClass('from-gold');
      expect(text).toHaveClass('to-gold/60');
      expect(text).toHaveClass('bg-clip-text');
      expect(text).toHaveClass('text-transparent');
    });

    it('maintains proper layout structure', () => {
      render(<LogoWithText />);

      const text = screen.getByText('FitGenius');
      const container = text.parentElement;
      const svg = screen.getByRole('img', { hidden: true });

      expect(container?.firstChild).toBe(svg);
      expect(container?.lastChild).toBe(text);
    });
  });

  describe('Accessibility', () => {
    it('logo is accessible to screen readers', () => {
      render(<Logo />);

      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
    });

    it('LogoWithText provides text content for screen readers', () => {
      render(<LogoWithText />);

      const text = screen.getByText('FitGenius');
      expect(text).toBeInTheDocument();
      expect(text.textContent).toBe('FitGenius');
    });
  });
});