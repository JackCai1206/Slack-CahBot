import { Cards } from '../game/cards';

let cards = new Cards();

console.log(cards.cleanText('You have my sword. &quot;And you have my bow.&quot; &quot;And <i>my</i> _______!&quot;'));
