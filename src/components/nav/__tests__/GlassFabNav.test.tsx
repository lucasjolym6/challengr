import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import GlassFabNav from '../GlassFabNav';

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const MockedGlassFabNav = ({ ...props }) => (
  <BrowserRouter>
    <GlassFabNav {...props} />
  </BrowserRouter>
);

describe('GlassFabNav', () => {
  it('renders the main FAB button', () => {
    render(<MockedGlassFabNav />);
    
    const fabButton = screen.getByLabelText(/open navigation menu/i);
    expect(fabButton).toBeInTheDocument();
  });

  it('expands when FAB is clicked', () => {
    render(<MockedGlassFabNav />);
    
    const fabButton = screen.getByLabelText(/open navigation menu/i);
    fireEvent.click(fabButton);
    
    expect(screen.getByLabelText(/close navigation menu/i)).toBeInTheDocument();
  });

  it('shows navigation items when expanded', () => {
    render(<MockedGlassFabNav />);
    
    const fabButton = screen.getByLabelText(/open navigation menu/i);
    fireEvent.click(fabButton);
    
    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByLabelText('Community')).toBeInTheDocument();
    expect(screen.getByLabelText('Profile')).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<MockedGlassFabNav />);
    
    const fabButton = screen.getByLabelText(/open navigation menu/i);
    expect(fabButton).toHaveAttribute('aria-expanded', 'false');
    expect(fabButton).toHaveAttribute('aria-controls', 'glass-fab-panel');
  });

  it('uses custom items when provided', () => {
    const customItems = [
      { id: 'test', label: 'Test', icon: <span>Test</span>, href: '/test' }
    ];
    
    render(<MockedGlassFabNav items={customItems} />);
    
    const fabButton = screen.getByLabelText(/open navigation menu/i);
    fireEvent.click(fabButton);
    
    expect(screen.getByLabelText('Test')).toBeInTheDocument();
  });
});
