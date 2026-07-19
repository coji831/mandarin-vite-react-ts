/**
 * Tokens used: --surface-overlay, --color-primary, --shadow-lg
 * See: DESIGN.md
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "../Button/Button";

const meta: Meta<typeof Modal> = {
  title: "Shared/Modal",
  component: Modal,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    isOpen: { control: "boolean" },
    title: { control: "text" },
    size: { control: "select", options: ["sm", "md", "lg"] },
    onClose: { action: "closed" },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Small: Story = {
  name: "Modal — Small",
  args: {
    isOpen: true,
    title: "Confirm",
    size: "sm",
    children: (
      <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>
        Are you sure you want to proceed?
      </p>
    ),
    footer: (
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="secondary" size="sm">
          Cancel
        </Button>
        <Button variant="primary" size="sm">
          Confirm
        </Button>
      </div>
    ),
    onClose: () => {},
  },
};

export const Medium: Story = {
  name: "Modal — Medium",
  args: {
    isOpen: true,
    title: "Details",
    size: "md",
    children: (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.87)", fontSize: "0.9rem" }}>
          Main content area with details about the selected item.
        </p>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>
          Additional information can go here. The modal scrolls if content overflows.
        </p>
      </div>
    ),
    onClose: () => {},
  },
};

export const Large: Story = {
  name: "Modal — Large",
  args: {
    isOpen: true,
    title: "Full Details",
    size: "lg",
    children: (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.87)" }}>
          Large modal with more space for content like forms, data tables, or media.
        </p>
      </div>
    ),
    onClose: () => {},
  },
};

export const Interactive: Story = {
  name: "Modal — Interactive",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal isOpen={open} onClose={() => setOpen(false)} title="Interactive Demo" size="md">
          <p style={{ margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>
            This modal opens and closes via state. Click backdrop, press Escape, or click ✕ to
            close.
          </p>
        </Modal>
      </div>
    );
  },
};
