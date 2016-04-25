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
  @Intent('Question', 'Response')
  question({ answer }, { type }) {
    const start = type === 'LaunchRequest';
    const { answer: correctAnswer } = this.attributes.previous || {};

    let pretext;
    if (start) {
      pretext = 'Welcome to the game-show! Here\'s your first question.';
    } else if (correctAnswer && answer) {
      pretext = isCorrect(answer, correctAnswer) ? 'Correct! Next question.' : `Incorrect! The correct answer was "${correctAnswer}". Next question.`;
    }

    return this._question(start, pretext);
  }

  @Intent('AMAZON.HelpIntent')
  help() {
    return this._question(true, 'The game-show is a trivia quiz. I\'ll ask questions and you guess the answers. Here\'s a question.');
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
