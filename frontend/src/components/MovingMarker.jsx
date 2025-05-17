import { useRef, useEffect } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import PropTypes from 'prop-types';

const MovingMarker = ({ position, icon, eventHandlers, children, speed = 0, isOffline = false, isStationary = false, status = '' }) => {
  const markerRef = useRef(null);
  const lastPositionRef = useRef(position);
  const lastUpdateTimeRef = useRef(Date.now());
  const smoothAnimationRef = useRef(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    // Clear any existing animation
    if (smoothAnimationRef.current) {
      cancelAnimationFrame(smoothAnimationRef.current);
      smoothAnimationRef.current = null;
    }

    const leafletElement = marker.leafletElement || marker._leafletElement;
    if (!leafletElement) return;

    const now = Date.now();
    // Store the current time for future use
    lastUpdateTimeRef.current = now;

    // Don't animate if this is the first position or if offline or stationary
    if (!lastPositionRef.current || isOffline || isStationary) {
      leafletElement.setLatLng(position);
      lastPositionRef.current = position;
      return;
    }

    // Calculate animation duration based on speed
    // Slower speed = longer animation duration for smoother transitions
    // Faster speeds get quicker updates to show real-time changes
    let animationDuration = 500; // default base duration in ms
    
    if (speed < 5) {
      animationDuration = 800; // slower animation for slow moving shuttles
    } else if (speed > 20) {
      animationDuration = 300; // faster animation for fast moving shuttles
    }

    // Maximum animation duration to prevent very slow transitions
    const maxDuration = 1500;
    animationDuration = Math.min(animationDuration, maxDuration);

    // Store the current position for the next update
    lastPositionRef.current = position;

    // Animate the marker movement
    const startPosition = leafletElement.getLatLng();
    const targetPosition = L.latLng(position[0], position[1]);
    
    // For longer durations, use frame-by-frame animation for smoother transitions
    const startTime = Date.now();
    
    const animateStep = () => {
      const currentTime = Date.now();
      const progress = Math.min(1, (currentTime - startTime) / animationDuration);
      
      // Apply easing function for smoother motion
      const easedProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI);
      
      const lat = startPosition.lat + (targetPosition.lat - startPosition.lat) * easedProgress;
      const lng = startPosition.lng + (targetPosition.lng - startPosition.lng) * easedProgress;
      
      leafletElement.setLatLng([lat, lng]);
      
      if (progress < 1) {
        smoothAnimationRef.current = requestAnimationFrame(animateStep);
      } else {
        smoothAnimationRef.current = null;
      }
    };
    
    smoothAnimationRef.current = requestAnimationFrame(animateStep);

    // Apply visual effects based on status
    const iconElement = leafletElement.getElement();
    if (iconElement) {
      // Reset all styles first
      iconElement.style.filter = 'none';
      iconElement.style.animation = 'none';
      iconElement.style.opacity = '1.0';
      
      // Debug logging for visual effects
      console.log("Applying visual effects:", {
        status,
        isOffline,
        isStationary,
        speed,
        position
      });
      
      // Apply specific styles based on status
      if (isOffline) {
        // Offline shuttles appear grayscale
        iconElement.style.filter = 'grayscale(100%)';
        iconElement.style.opacity = '0.6';
      } else if (status === 'At Terminal' && isStationary) {
        // At Terminal shuttles get a green tint ONLY if they're actually stationary
        iconElement.style.filter = 'hue-rotate(90deg) saturate(1.2)';
        iconElement.style.opacity = '0.9';
      } else if (isStationary) {
        // Stationary shuttles are slightly transparent
        iconElement.style.opacity = '0.8';
      } else if (speed > 10) {
        // Fast moving shuttles get a pulse animation
        iconElement.style.animation = 'pulse 1s infinite';
      }
    }

    return () => {
      if (smoothAnimationRef.current) {
        cancelAnimationFrame(smoothAnimationRef.current);
        smoothAnimationRef.current = null;
      }
    };
  }, [position, speed, isOffline, isStationary, status]);

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
      eventHandlers={eventHandlers}
    >
      {children}
    </Marker>
  );
};

MovingMarker.propTypes = {
  position: PropTypes.array.isRequired,
  icon: PropTypes.object,
  eventHandlers: PropTypes.object,
  children: PropTypes.node,
  speed: PropTypes.number,
  isOffline: PropTypes.bool,
  isStationary: PropTypes.bool,
  status: PropTypes.string
};

export default MovingMarker;
