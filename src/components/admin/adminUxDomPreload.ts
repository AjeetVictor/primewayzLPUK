import { Window } from 'happy-dom';

// Radix binds layout effects and event classes when its module loads.
// Keep one document so those classes match the nodes under test.
export const adminTestWindow = new Window({ url: 'http://localhost/admin' });

function expose(key: string, value: unknown) {
  Object.defineProperty(globalThis, key, { configurable: true, value });
}

expose('window', adminTestWindow);
expose('document', adminTestWindow.document);
expose('HTMLElement', adminTestWindow.HTMLElement);
expose('Element', adminTestWindow.Element);
expose('Node', adminTestWindow.Node);
expose('DocumentFragment', adminTestWindow.DocumentFragment);
expose('Event', adminTestWindow.Event);
expose('CustomEvent', adminTestWindow.CustomEvent);
expose('KeyboardEvent', adminTestWindow.KeyboardEvent);
expose('MouseEvent', adminTestWindow.MouseEvent);
expose('FocusEvent', adminTestWindow.FocusEvent);
expose('PointerEvent', adminTestWindow.PointerEvent);
expose('InputEvent', adminTestWindow.InputEvent);
expose('MutationObserver', adminTestWindow.MutationObserver);
expose('navigator', adminTestWindow.navigator);
expose('getComputedStyle', adminTestWindow.getComputedStyle.bind(adminTestWindow));
expose('requestAnimationFrame', (callback: FrameRequestCallback) => adminTestWindow.requestAnimationFrame(callback));
expose('cancelAnimationFrame', (handle: number) => adminTestWindow.cancelAnimationFrame(handle as never));
expose('IS_REACT_ACT_ENVIRONMENT', true);
