import BrowserDetect from "./modules/BrowserDetect";
import SmoothScroll from "./modules/SmoothScroll";

/**
 * ブラウザ判定用のクラスを設定する
 */
new BrowserDetect();

/**
 * スムーススクロール
 */
new SmoothScroll();

if (module.hot) {
	module.hot.accept();
}
