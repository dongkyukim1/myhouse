"use client";

import { useEffect } from 'react';

export default function CyberEffects() {
  useEffect(() => {
    // Create floating particles
    const createParticles = () => {
      const particlesContainer = document.getElementById('particles');
      if (!particlesContainer) return;

      const particleCount = 30;

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
        
        // Randomly assign orange or blue color
        if (Math.random() > 0.5) {
          particle.style.setProperty('--particle-color', '#00B2FF');
          const style = document.createElement('style');
          style.textContent = `
            .particle:nth-child(${i + 1})::before {
              background: #00B2FF !important;
              box-shadow: 0 0 10px #00B2FF, 0 0 20px #00B2FF !important;
            }
          `;
          document.head.appendChild(style);
        }
        
        particlesContainer.appendChild(particle);
      }
    };

    // Add random glitch effect
    const addGlitchEffect = () => {
      const glitchTexts = document.querySelectorAll('.glitch-text');
      glitchTexts.forEach(text => {
        if (Math.random() > 0.95) {
          const element = text as HTMLElement;
          element.style.animation = 'none';
          setTimeout(() => {
            element.style.animation = '';
          }, 200);
        }
      });
    };

    // Initialize particles
    createParticles();

    // Start glitch effect interval
    const glitchInterval = setInterval(addGlitchEffect, 3000);

    // Smooth scrolling for navigation links
    const handleSmoothScroll = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetElement = document.querySelector(target.getAttribute('href') || '');
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    };

    // Add smooth scroll listeners
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', handleSmoothScroll);
    });

    // Cleanup
    return () => {
      clearInterval(glitchInterval);
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.removeEventListener('click', handleSmoothScroll);
      });
    };
  }, []);

  return null; // This component only adds effects, no render
}
