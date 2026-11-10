// Catches a failure inside the 3D view (e.g. a graphics driver problem or a
// lost WebGL context) and shows the non-3D museum guide instead of a blank
// screen.

import { Component, type ReactNode } from "react";

export class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("The 3D museum stopped; showing the museum guide instead.", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
