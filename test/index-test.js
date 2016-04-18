import test from 'ava';
import { handler as Skill } from '..';
import { Request } from 'alexa-annotations';

test.skip('LaunchRequest', t => {
  const event = Request.launchRequest().build();

  return Skill(event).then(response => {
    console.log(JSON.stringify(response, null, 2));
    t.deepEqual(response, {
      version: '1.0',
      response: {
        shouldEndSession: true,
        outputSpeech: { type: 'PlainText', text: 'Gameshow launched!' }
      }
    });
  });
});

test.skip('Question intent', t => {
  const event = Request.intent('hello', { name: 'world' }).build();

  return Skill(event).then(response => {
    t.deepEqual(response, {
      version: '1.0',
      response: {
        shouldEndSession: true,
        outputSpeech: { type: 'PlainText', text: 'Hello world' },
        card: { type: 'Simple', title: 'Gameshow', content: 'Hello world' }
      }
    });
  });
});
