import { GameEngine } from '../game/GameEngine.ts';
import { Disease, GameState } from '../game/types.ts';

export class GameBoard {
  private game: GameEngine;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.game = new GameEngine();
    this.container = container;
    this.setupEventListeners();
    
    // Subscribe to game state changes
    this.game.subscribe(() => this.render());
    
    // Start the game
    this.game.startTurn();
  }

  private setupEventListeners(): void {
    // New Game button
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.id === 'new-game-btn') {
        if (confirm('Are you sure you want to start a new game?')) {
          this.game.resetGame();
        }
      } else if (target.id === 'rules-btn') {
        this.showRules();
      } else if (target.id === 'confirm-infection-btn') {
        this.game.applyInfection();
      } else if (target.id === 'confirm-treatment-btn') {
        this.game.confirmTreatment();
      } else {
        // Find the treatment die element (could be the target or its parent)
        const treatmentDie = target.closest('.treatment-die') as HTMLElement;
        if (treatmentDie && treatmentDie.classList.contains('clickable')) {
          const dieIndex = parseInt(treatmentDie.dataset['dieIndex'] || '0');
          this.game.toggleSaveDie(dieIndex);
          
          // Add temporary selection highlight
          treatmentDie.classList.add('selected');
          setTimeout(() => {
            treatmentDie.classList.remove('selected');
          }, 300);
        }
      }
    });
  }

  private showRules(): void {
    const rules = `
      <h2>Epidemic Express Rules</h2>
      <p><strong>Goal:</strong> Cure all 5 diseases before any reach level 6 or panic reaches level 6.</p>
      
      <h3>Turn Structure:</h3>
      <ol>
        <li><strong>Role Selection:</strong> Random role with special ability</li>
        <li><strong>Infection Phase:</strong> Roll infection dice and apply effects</li>
        <li><strong>Treatment Phase:</strong> Roll treatment dice and treat diseases</li>
      </ol>
      
      <h3>Roles:</h3>
      <ul>
        <li><strong>Medic:</strong> Avoid one disease level increase</li>
        <li><strong>Researcher:</strong> Get an extra treatment roll</li>
        <li><strong>PR Expert:</strong> Reduce panic on 3-of-a-kind</li>
        <li><strong>Scientist:</strong> Cure disease with Full House</li>
        <li><strong>Epidemiologist:</strong> Re-roll Panics without penalty</li>
        <li><strong>Bio-terrorist:</strong> All disease levels increase</li>
      </ul>
    `;
    
    alert(rules);
  }

  private render(): void {
    const state = this.game.getState();
    
    this.container.innerHTML = `
      <div class="game-container">
        <header class="game-header">
          <h1>Epidemic Express</h1>
          <div class="game-controls">
            <button id="rules-btn" class="btn btn-secondary">Rules</button>
            <button id="new-game-btn" class="btn btn-primary">New Game</button>
          </div>
        </header>
        
        <div class="game-panels">
          ${this.renderDiseasePanel(state)}
          ${this.renderRolePanel(state)}
          ${state.gamePhase === 'infection' ? this.renderInfectionPanel(state) : this.renderTreatmentPanel(state)}
          ${this.renderMessagePanel(state)}
        </div>
      </div>
    `;
  }

  private renderDiseasePanel(state: GameState): string {
    const diseaseNames = ['Avian', 'Swine', 'SARS', 'S-pox', 'Ebola'];
    const diseaseImages = ['avian.png', 'swine.png', 'sars.png', 'smallpox.png', 'ebola.png'];
    
    return `
      <div class="panel disease-panel">
        <h3>Disease Levels</h3>
        <div class="disease-levels">
          ${state.diseases.map((level: number | null, index: number) => `
            <div class="disease-item">
              <div class="disease-icon">
                <img src="assets/images/${diseaseImages[index]}" alt="${diseaseNames[index]}" />
                ${this.renderLevelIndicator(level)}
              </div>
              <span class="disease-name">${diseaseNames[index]}</span>
            </div>
          `).join('')}
          
          <div class="disease-item">
            <div class="disease-icon">
              <img src="assets/images/panic.png" alt="Panic" />
              ${this.renderLevelIndicator(state.panicLevel, true)}
            </div>
            <span class="disease-name">Panic</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderLevelIndicator(level: number | null, isPanic: boolean = false): string {
    if (level === null) {
      return '<img src="assets/images/shot.png" class="level-indicator" alt="Cured" />';
    } else if (level >= 6) {
      return '<img src="assets/images/lost.png" class="level-indicator" alt="Lost" />';
    } else {
      return `<span class="level-number ${isPanic ? 'panic-level' : ''}">${level}</span>`;
    }
  }

  private renderRolePanel(state: GameState): string {
    return `
      <div class="panel role-panel">
        <h3>Current Role</h3>
        <div class="role-info">
          <div class="role-image">
            <img src="assets/images/${this.game.getRoleImage(state.currentRole)}" alt="${this.game.getRoleName(state.currentRole)}" />
          </div>
          <div class="role-details">
            <div class="role-name">${this.game.getRoleName(state.currentRole)}</div>
            <div class="role-description">${this.game.getRoleDescription(state.currentRole)}</div>
          </div>
        </div>
      </div>
    `;
  }

  private renderInfectionPanel(state: GameState): string {
    return `
      <div class="panel infection-panel">
        <h3>Infection Phase</h3>
        <div class="dice-container">
          ${state.infectionDice.map((die: Disease) => `
            <div class="die infection-die">
              <img src="assets/images/${this.game.getDiseaseImage(die)}" alt="${this.game.getDiseaseName(die)}" />
            </div>
          `).join('')}
        </div>
        <button id="confirm-infection-btn" class="btn btn-primary">Confirm Infection</button>
      </div>
    `;
  }

  private renderTreatmentPanel(state: GameState): string {
    const rerollsText = state.rerollsRemaining > 0 
      ? `Re-roll Treatment (${state.rerollsRemaining} left)`
      : 'Confirm Treatment';

    return `
      <div class="panel treatment-panel">
        <h3>Treatment Phase</h3>
        <div class="dice-container">
          ${state.treatmentDice.map((die: Disease, index: number) => `
            <div class="die treatment-die ${state.savedTreatmentDice[index] ? 'saved' : ''} ${state.rerollsRemaining > 0 ? 'clickable' : ''}" 
                 data-die-index="${index}"
                 title="${state.savedTreatmentDice[index] ? 'Click to unsave for re-roll' : 'Click to save from re-roll'}">
              <img src="assets/images/${this.game.getDiseaseImage(die)}" alt="${this.game.getDiseaseName(die)}" />
              ${state.savedTreatmentDice[index] ? '<img src="assets/images/checkmark.png" class="checkmark" alt="Saved" />' : ''}
            </div>
          `).join('')}
        </div>
        <button id="confirm-treatment-btn" class="btn btn-primary">${rerollsText}</button>
        <p class="treatment-hint">Click dice to save/unsave them for re-rolls</p>
      </div>
    `;
  }

  private renderMessagePanel(state: GameState): string {
    return `
      <div class="panel message-panel">
        <h3>Game Message</h3>
        <div class="message-content">${state.message}</div>
        ${state.hasWon ? '<div class="victory-message">🎉 You have won! 🎉</div>' : ''}
        ${state.hasLost ? '<div class="defeat-message">💀 Game Over 💀</div>' : ''}
      </div>
    `;
  }
}