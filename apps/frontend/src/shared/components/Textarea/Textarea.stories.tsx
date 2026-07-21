/**
 * @file Textarea.stories.tsx
 * @description Storybook stories for the shared Textarea component
 * Story 20.2: Mnemonic Display UI
 *
 * Covers: default (empty with placeholder), with value, disabled, with maxLength
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "Shared/Textarea",
  component: Textarea,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    value: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    maxLength: { control: "number" },
    rows: { control: "number" },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

// ─── Default ────────────────────────────────────────────────────────────

export const Default: Story = {
  name: "Default — Empty with placeholder",
  render: (args) => {
    const [value, setValue] = useState("");
    return <Textarea {...args} value={value} onChange={setValue} />;
  },
  args: {
    placeholder: "Enter text…",
    rows: 4,
  },
};

// ─── With Value ─────────────────────────────────────────────────────────

export const WithValue: Story = {
  name: "With value — Pre-filled text",
  render: (args) => {
    const [value, setValue] = useState(
      "This is a mnemonic story about the character 好.\n\nA woman (女) with a child (子) represents goodness.",
    );
    return <Textarea {...args} value={value} onChange={setValue} />;
  },
  args: {
    placeholder: "Enter text…",
    rows: 4,
  },
};

// ─── Disabled ───────────────────────────────────────────────────────────

export const Disabled: Story = {
  name: "Disabled — Non-editable",
  render: (args) => {
    const [value] = useState("This content cannot be edited.");
    return <Textarea {...args} value={value} onChange={() => {}} />;
  },
  args: {
    placeholder: "Enter text…",
    rows: 4,
    disabled: true,
  },
};

// ─── With MaxLength ─────────────────────────────────────────────────────

export const WithMaxLength: Story = {
  name: "With maxLength — Character limit shown",
  render: (args) => {
    const [value, setValue] = useState("Short text");
    return <Textarea {...args} value={value} onChange={setValue} />;
  },
  args: {
    placeholder: "Max 50 characters…",
    rows: 4,
    maxLength: 50,
  },
};
