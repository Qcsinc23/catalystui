import { Buffer } from 'buffer';
import { EventEmitter } from 'events';

// Polyfill Buffer
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

// Polyfill EventEmitter
if (typeof window !== 'undefined') {
  (window as any).EventEmitter = EventEmitter;
}

export { Buffer, EventEmitter };
