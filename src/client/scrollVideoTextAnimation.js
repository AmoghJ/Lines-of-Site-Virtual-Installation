import anime from 'animejs/lib/anime.es.js';

class TextAnimationTimeline {
  constructor() {
    this.timeline = null;
  }
}

function AddTextAnimation(textAnimation) {
    textAnimation.timeline = anime.timeline({
        autoplay : false,
        duration : 4500,
        easing : 'easeOutSine'
      });

      textAnimation.timeline.add({
        targets: '#testText',
        opacity: 1,
        duration: 2500,
      }, 5000);
      
      textAnimation.timeline.add({
        targets: '#testText',
        opacity: 0,
        duration: 2500
      }, '+=2500');
    }

export {TextAnimationTimeline, AddTextAnimation};