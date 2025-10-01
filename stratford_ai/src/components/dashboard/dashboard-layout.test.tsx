/**
 * Dashboard Layout Component Tests
 *
 * Comprehensive test suite for the main dashboard layout component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardLayout } from './dashboard-layout';

describe('DashboardLayout', () => {
  it('renders the main layout structure', () => {
    render(
      <DashboardLayout>
        <div data-testid="test-content">Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('displays the application title in header', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Stratford AI')).toBeInTheDocument();
  });

  it('shows version information', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
  });

  it('has sticky header navigation', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const header = container.querySelector('header');
    expect(header).toHaveClass('sticky', 'top-0');
  });

  it('renders footer with technology credits', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText(/Built with deterministic build methodology/)).toBeInTheDocument();
    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.getByText('Tailwind CSS')).toBeInTheDocument();
    expect(screen.getByText('Recharts')).toBeInTheDocument();
  });

  it('has proper container sizing and padding', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('container', 'mx-auto', 'px-4', 'py-6', 'max-w-screen-2xl');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <DashboardLayout className="custom-class">
        <div>Content</div>
      </DashboardLayout>
    );

    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('custom-class');
  });

  it('renders logo/brand area', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Check for logo placeholder (colored square)
    const logo = container.querySelector('.h-6.w-6.rounded.bg-primary');
    expect(logo).toBeInTheDocument();
  });

  it('has proper header structure', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const header = container.querySelector('header');
    expect(header).toHaveClass('border-b', 'bg-background/95', 'backdrop-blur');
  });

  it('has responsive header container', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const headerContainer = container.querySelector('header .container');
    expect(headerContainer).toHaveClass('flex', 'h-14', 'max-w-screen-2xl', 'items-center');
  });

  it('renders children content properly', () => {
    const testContent = (
      <div>
        <h1>Dashboard Title</h1>
        <p>Dashboard content goes here</p>
      </div>
    );

    render(
      <DashboardLayout>
        {testContent}
      </DashboardLayout>
    );

    expect(screen.getByText('Dashboard Title')).toBeInTheDocument();
    expect(screen.getByText('Dashboard content goes here')).toBeInTheDocument();
  });

  it('has full height layout', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const layoutRoot = container.firstChild;
    expect(layoutRoot).toHaveClass('min-h-screen', 'bg-background');
  });

  it('has proper footer layout', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('border-t', 'py-6');

    const footerContainer = footer?.querySelector('.container');
    expect(footerContainer).toHaveClass('flex', 'flex-col', 'items-center', 'justify-between', 'md:h-24', 'md:flex-row');
  });

  it('renders technology links with proper attributes', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const nextjsLink = screen.getByRole('link', { name: 'Next.js' });
    expect(nextjsLink).toHaveAttribute('href', 'https://nextjs.org');
    expect(nextjsLink).toHaveAttribute('target', '_blank');
    expect(nextjsLink).toHaveAttribute('rel', 'noreferrer');

    const tailwindLink = screen.getByRole('link', { name: 'Tailwind CSS' });
    expect(tailwindLink).toHaveAttribute('href', 'https://tailwindcss.com');
    expect(tailwindLink).toHaveAttribute('target', '_blank');

    const rechartsLink = screen.getByRole('link', { name: 'Recharts' });
    expect(rechartsLink).toHaveAttribute('href', 'https://recharts.org');
    expect(rechartsLink).toHaveAttribute('target', '_blank');
  });

  it('has accessible structure', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Check for proper semantic HTML structure
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('main')).toBeInTheDocument();   // main
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
  });

  it('brand area is hidden on small screens when appropriate', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const brandText = container.querySelector('.hidden.sm\\:inline-block');
    expect(brandText).toBeInTheDocument();
    expect(brandText).toHaveTextContent('Stratford AI');
  });

  it('footer text is responsive', () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const footerText = container.querySelector('.text-center.md\\:text-left');
    expect(footerText).toBeInTheDocument();
  });
});