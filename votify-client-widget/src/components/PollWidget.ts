import { html, LitElement, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { PollOption, PollResult, PollData } from "../utils/model";

@customElement("poll-widget")
export class PollWidget extends LitElement {
  @property({ type: String }) question = "Which is your favorite JavaScript library/framework?";
  @property({ type: Array }) options: PollOption[] = [
    { id: "1", text: "React", votes: 234 },
    { id: "2", text: "Vue", votes: 183 },
    { id: "3", text: "Svelte", votes: 51 },
  ];

  @state() private hasVoted = false;
  @state() private selectedOption: string | null = null;

  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans",
        "Helvetica Neue", sans-serif;
      max-width: 400px;
      margin: 0 auto;
    }

    .poll-container {
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1.5rem;
      background-color: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .poll-question {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: #1a202c;
    }

    .poll-option {
      display: flex;
      align-items: center;
      margin-bottom: 0.75rem;
      cursor: pointer;
      padding: 0.75rem;
      border-radius: 0.375rem;
      transition: background-color 0.2s;
    }

    .poll-option:hover {
      background-color: #f7fafc;
    }

    .poll-option.selected {
      background-color: #ebf8ff;
      border: 1px solid #4299e1;
    }

    .poll-option input {
      margin-right: 0.75rem;
    }

    .poll-option label {
      flex-grow: 1;
      cursor: pointer;
    }

    .poll-button {
      background-color: #4299e1;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
      margin-top: 1rem;
    }

    .poll-button:hover {
      background-color: #3182ce;
    }

    .poll-button:disabled {
      background-color: #a0aec0;
      cursor: not-allowed;
    }

    .poll-results {
      margin-top: 1.5rem;
    }

    .poll-result-item {
      margin-bottom: 0.75rem;
    }

    .poll-result-bar {
      height: 8px;
      background-color: #e2e8f0;
      border-radius: 4px;
      margin-top: 0.25rem;
      overflow: hidden;
    }

    .poll-result-fill {
      height: 100%;
      background-color: #4299e1;
      border-radius: 4px;
      transition: width 0.5s ease-in-out;
    }

    .poll-result-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: #4a5568;
    }

    .poll-total {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: #718096;
      text-align: center;
    }
  `;

  private handleOptionSelect(optionId: string) {
    if (!this.hasVoted) {
      this.selectedOption = optionId;
    }
  }

  private async submitVote() {
    if (!this.selectedOption || this.hasVoted) return;

    // In a real implementation, you would send this to your backend
    // For demo purposes, we'll just simulate it
    this.options = this.options.map((option) => {
      if (option.id === this.selectedOption) {
        return { ...option, votes: option.votes + 1 };
      }
      return option;
    });

    this.hasVoted = true;

    // Dispatch an event that the vote was submitted
    this.dispatchEvent(
      new CustomEvent("vote-submitted", {
        detail: {
          selectedOption: this.selectedOption,
          results: this.getResults(),
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  private getResults(): PollResult {
    const totalVotes = this.options.reduce((sum, option) => sum + option.votes, 0);
    return {
      question: this.question,
      options: this.options,
      totalVotes,
      hasVoted: this.hasVoted,
    };
  }

  private calculatePercentage(votes: number, total: number): number {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  }

  render() {
    const totalVotes = this.options.reduce((sum, option) => sum + option.votes, 0);

    return html`
      <div class="poll-container">
        <div class="poll-question">${this.question}</div>

        ${!this.hasVoted
          ? html`
              <div class="poll-options">
                ${this.options.map(
                  (option) => html`
                    <div
                      class="poll-option ${this.selectedOption === option.id ? "selected" : ""}"
                      @click="${() => this.handleOptionSelect(option.id)}"
                    >
                      <input
                        type="radio"
                        id="option-${option.id}"
                        name="poll-option"
                        .checked="${this.selectedOption === option.id}"
                        @change="${() => this.handleOptionSelect(option.id)}"
                      />
                      <label for="option-${option.id}">${option.text}</label>
                    </div>
                  `
                )}
              </div>

              <button class="poll-button" @click="${this.submitVote}" ?disabled="${!this.selectedOption}">
                Submit Vote
              </button>
            `
          : html`
              <div class="poll-results">
                ${this.options.map((option) => {
                  const percentage = this.calculatePercentage(option.votes, totalVotes);
                  return html`
                    <div class="poll-result-item">
                      <div>${option.text}</div>
                      <div class="poll-result-info">
                        <span>${option.votes} votes</span>
                        <span>${percentage}%</span>
                      </div>
                      <div class="poll-result-bar">
                        <div class="poll-result-fill" style="width: ${percentage}%"></div>
                      </div>
                    </div>
                  `;
                })}
              </div>
              <div class="poll-total">Total votes: ${totalVotes}</div>
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "poll-widget": PollWidget;
  }
}
