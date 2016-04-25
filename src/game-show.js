import { Skill, Launch, Intent, SessionEnded } from 'alexa-annotations';
import Response, { say } from 'alexa-response';
import { ssml } from 'alexa-ssml';
import fetch from 'isomorphic-fetch';
import cleanup from 'kevbook.text-cleanup';
import capitalize from 'capitalize';

const jService = () => fetch('http://jservice.io/api/random').then(response => response.json());

const normalize = (text) => cleanup(text).toLowerCase();

const isCorrect = (actual, expected) => {
  return [actual, expected].filter(Boolean).map(normalize).reduce((answer, correctAnswer) => {
    return answer === correctAnswer;
  });
};

@Skill
export default class Gameshow {

  constructor(attributes = {}, getQuestion = jService) {
    this.attributes = attributes;
    this.getQuestion = getQuestion;
  }

  @Launch
  @Intent('Question', 'Response', 'AMAZON.HelpIntent')
  question({ answer }, { type, intent }) {
    const start = (type === 'LaunchRequest') || (intent && intent.name === 'AMAZON.HelpIntent');
    const { answer: correctAnswer } = this.attributes.previous || {};

    let pretext;
    if (start) {
      pretext = 'Welcome to the game-show! Here\'s your first question.';
    } else if (correctAnswer && answer) {
      pretext = isCorrect(answer, correctAnswer) ? 'Correct! Next question.' : `Incorrect! The correct answer was "${correctAnswer}". Next question.`;
    }

    return this._question(start, pretext);
  }

  @SessionEnded
  @Intent('AMAZON.CancelIntent', 'AMAZON.StopIntent')
  stop() {
    return say('Thanks for playing! See you next time on the game-show!');
  }

  _question(isFirst, pretext) {
    return this.getQuestion().then(([nextQuestion]) => {
      const { category, answer, question } = nextQuestion;
      const { previous } = this.attributes;
      return Response.build({
        ask: [pretext, category.title && `The category is, "${category.title}", and', 'the question is, "${question}".`].filter(Boolean).join(' '),
        reprompt: question,
        attributes: { previous: { category, answer, question } },
        ...(!isFirst && previous && {
          card: {
            type: 'Standard',
            title: capitalize.words(previous.category.title || 'Game Show'),
            text: `${previous.question}\n\nAnswer: ${cleanup(previous.answer)}`
          }
        })
      });
    });
  }

}
