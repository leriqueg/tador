import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from '../components/ui/Button.tsx';
import PasswordRequirement from '../components/ui/PasswordRequirement.tsx';
import TextInput from '../components/ui/TextInput.tsx';
import { AITemplateResult, ConversationalWizard, FabButton } from '../components/inputs/InputPatterns.tsx';

const meta = {
  title: 'Primitives/Inputs',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

export const TextField: StoryObj = {
  render: () => (
    <div className="component-demo max-w-md">
      <TextInput label="Email" icon="mail" placeholder="nombre@ejemplo.com" type="email" />
    </div>
  ),
};

export const ButtonVariants: StoryObj = {
  render: () => (
    <div className="component-demo flex flex-wrap gap-md">
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="surface">Surface</Button>
    </div>
  ),
};

export const PasswordRequirements: StoryObj = {
  render: () => (
    <div className="component-demo flex flex-wrap gap-xs">
      <PasswordRequirement label="Mín. 8 caracteres" met />
      <PasswordRequirement label="Una mayúscula" met={false} />
    </div>
  ),
};

export const ConversationalStep: StoryObj = {
  render: () => (
    <div className="component-demo max-w-md">
      <ConversationalWizard />
    </div>
  ),
};

export const AIResult: StoryObj = {
  render: () => (
    <div className="component-demo max-w-md">
      <AITemplateResult />
    </div>
  ),
};

export const FloatingActionButton: StoryObj = {
  render: () => <FabButton />,
  parameters: { layout: 'fullscreen' },
};
