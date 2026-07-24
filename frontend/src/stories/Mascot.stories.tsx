import type { Meta, StoryObj } from '@storybook/react-vite';
import { PachoAssistant, PachoGreeting, PachoMentorCard } from '../components/mascot/Pacho.tsx';

const meta = {
  title: 'Experimental/Pacho',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

export const Mentor: StoryObj = {
  render: () => (
    <div className="component-demo max-w-xl">
      <PachoMentorCard message="Tu liquidez ha mejorado un 5% este trimestre. Es un buen momento para revisar inversiones." />
    </div>
  ),
};

export const Greeting: StoryObj = {
  render: () => (
    <div className="component-demo max-w-xl">
      <PachoGreeting userName="Alex" />
    </div>
  ),
};

export const Assistant: StoryObj = {
  render: () => (
    <div className="component-demo max-w-2xl">
      <PachoAssistant />
    </div>
  ),
};
