import { 
  Disease, 
  Role, 
  GameState, 
  DiseaseCounts,
  DISEASE_COUNT,
  LOSING_LEVEL,
  MAX_INFECTION_RATE,
  INITIAL_INFECTION_RATE,
  REROLLS_ALLOWED,
  DICE_TO_INCREASE_PANIC,
  NORMAL_DICE_TO_REDUCE_PANIC,
  PR_DICE_TO_REDUCE_PANIC
} from './types.ts';

export class GameEngine {
  private state: GameState;
  private listeners: Array<(state: GameState) => void> = [];

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      diseases: [0, 0, 0, 0, 0], // All diseases start at level 0
      panicLevel: 0,
      currentRole: Role.MEDIC,
      infectionRate: INITIAL_INFECTION_RATE,
      rerollsRemaining: 0,
      gamePhase: 'infection',
      infectionDice: [],
      treatmentDice: [],
      savedTreatmentDice: [false, false, false, false, false],
      lockedTreatmentDice: [false, false, false, false, false],
      hasWon: false,
      hasLost: false,
      message: 'Welcome to Epidemic Express!'
    };
  }

  // Subscribe to state changes
  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  // Roll dice
  private rollDice(count: number): Disease[] {
    const dice: Disease[] = [];
    for (let i = 0; i < count; i++) {
      dice.push(Math.floor(Math.random() * 6) as Disease);
    }
    return dice;
  }

  // Get counts by disease
  private getCountsByDisease(dice: Disease[]): DiseaseCounts {
    const counts: DiseaseCounts = {
      [Disease.AVIAN]: 0,
      [Disease.SWINE]: 0,
      [Disease.SARS]: 0,
      [Disease.SMALLPOX]: 0,
      [Disease.EBOLA]: 0,
      [Disease.PANIC]: 0
    };
    
    dice.forEach(die => {
      counts[die]++;
    });
    
    return counts;
  }

  // Start a new turn
  startTurn(): void {
    this.state.currentRole = Math.floor(Math.random() * 6) as Role;
    this.state.rerollsRemaining = this.getRerollsAllowed();
    this.state.gamePhase = 'infection';
    this.state.lockedTreatmentDice = [false, false, false, false, false];
    this.rollInfection();
    this.state.message = `You are the ${this.getRoleName(this.state.currentRole)}`;
    this.notifyListeners();
  }

  // Roll infection dice
  private rollInfection(): void {
    let infectionDiceCount = this.state.infectionRate;
    
    // Epidemiologist reduces infection dice
    if (this.state.currentRole === Role.EPIDEMIOLOGIST) {
      infectionDiceCount = Math.max(1, infectionDiceCount - 1);
    }
    
    this.state.infectionDice = this.rollDice(infectionDiceCount);
    this.state.message = 'Infection dice rolled. Confirm to apply infection.';
    this.notifyListeners();
  }

  // Apply infection
  applyInfection(): void {
    const counts = this.getCountsByDisease(this.state.infectionDice);
    const increase = [false, false, false, false, false];
    
    const panicDice = counts[Disease.PANIC];
    let diseaseGettingInfectedWithHighestLevel = -1;
    let highestLevelOfAnyDiseaseGettingInfected = -1;

    // Determine which diseases to increase
    this.state.infectionDice.forEach((infected: Disease) => {
      if (infected !== Disease.PANIC) {
        const level = this.state.diseases[infected];
        if (level !== null && level !== undefined && level > highestLevelOfAnyDiseaseGettingInfected) {
          diseaseGettingInfectedWithHighestLevel = infected;
          highestLevelOfAnyDiseaseGettingInfected = level;
        }
        if (infected >= 0 && infected < increase.length) {
          increase[infected] = true;
        }
      }
    });

    // Medic avoids one disease increase
    if (this.state.currentRole === Role.MEDIC && diseaseGettingInfectedWithHighestLevel >= 0) {
      increase[diseaseGettingInfectedWithHighestLevel] = false;
      this.state.message = `Medic avoided infection of ${this.getDiseaseName(diseaseGettingInfectedWithHighestLevel as Disease)}`;
    }

    // Apply disease increases
    for (let disease = 0; disease < DISEASE_COUNT; disease++) {
      if (this.state.diseases[disease] === null) continue;

      let willIncreaseLevel = increase[disease];
      
      // Bio-terrorist increases all diseases
      if (this.state.currentRole === Role.BIOTERRORIST) {
        willIncreaseLevel = true;
      }

      if (willIncreaseLevel) {
        this.state.diseases[disease]!++;
      }
    }

    // Handle panic increase
    let canIncreasePanic = true;
    if (this.state.currentRole === Role.BIOTERRORIST) {
      canIncreasePanic = false;
    }

    const shouldIncreasePanic = panicDice >= DICE_TO_INCREASE_PANIC;
    
    if (canIncreasePanic && shouldIncreasePanic) {
      this.state.panicLevel++;
    }

    // Check for loss
    this.checkGameOver();

    // Move to treatment phase
    if (!this.state.hasLost) {
      this.state.gamePhase = 'treatment';
      this.state.treatmentDice = [];
      this.state.savedTreatmentDice = [false, false, false, false, false];
      this.rollTreatment();
      this.state.message = 'Choose which treatment dice to keep';
    }

    this.notifyListeners();
  }

  // Roll treatment dice
  rollTreatment(): void {
    // Reset locked dice at the start of each roll
    this.state.lockedTreatmentDice = [false, false, false, false, false];
    
    for (let i = 0; i < 5; i++) {
      if (!this.state.savedTreatmentDice[i]) {
        // Penalty for re-rolling panics (except for epidemiologist)
        const isEpidemiologist = this.state.currentRole === Role.EPIDEMIOLOGIST;
        const penaltyForRerolling = !isEpidemiologist;
        
        if (penaltyForRerolling && this.state.treatmentDice[i] === Disease.PANIC) {
          this.state.panicLevel++;
        }
        
        this.state.treatmentDice[i] = Math.floor(Math.random() * 6) as Disease;
        
        // Auto-save and lock panic dice if penalty applies
        if (penaltyForRerolling && this.state.treatmentDice[i] === Disease.PANIC) {
          this.state.savedTreatmentDice[i] = true;
          this.state.lockedTreatmentDice[i] = true;
        }
      }
    }
    
    this.checkGameOver();
    this.notifyListeners();
  }

  // Toggle save state for a treatment die
  toggleSaveDie(dieIndex: number): void {
    if (this.state.rerollsRemaining <= 0) return;
    
    // Prevent unsaving locked dice (e.g., panic dice with penalty)
    if (this.state.lockedTreatmentDice[dieIndex] && !this.state.savedTreatmentDice[dieIndex]) {
      this.state.message = 'Cannot unsave locked panic die!';
      this.notifyListeners();
      return;
    }
    
    this.state.savedTreatmentDice[dieIndex] = !this.state.savedTreatmentDice[dieIndex];
    const action = this.state.savedTreatmentDice[dieIndex] ? 'Saving' : 'Rerolling';
    const disease = this.state.treatmentDice[dieIndex];
    if (disease !== undefined) {
      this.state.message = `${action} die ${dieIndex + 1}: ${this.getDiseaseName(disease)}`;
    }
    this.notifyListeners();
  }

  // Apply treatment
  applyTreatment(): void {
    const counts = this.getCountsByDisease(this.state.treatmentDice);
    
    // Check for panic reduction
    const willReducePanic = this.doesReducePanic(counts[Disease.PANIC]);
    if (willReducePanic) {
      this.state.panicLevel = Math.max(0, this.state.panicLevel - 1);
      this.state.message = 'Reduced Panic!';
    }

    // Apply disease treatments
    for (let disease = 0; disease < DISEASE_COUNT; disease++) {
      if (this.state.diseases[disease] === null) continue;

      const count = counts[disease as Disease];
      
      if (this.doesCureDisease(disease as Disease, counts)) {
        this.state.diseases[disease] = null;
        if (this.state.infectionRate < MAX_INFECTION_RATE) {
          this.state.infectionRate++;
        }
        this.state.message = `Cured ${this.getDiseaseName(disease as Disease)}!`;
      } else if (count > 0) {
        const newLevel = Math.max(0, this.state.diseases[disease]! - count);
        this.state.diseases[disease] = newLevel;
        this.state.message = `Reduced ${this.getDiseaseName(disease as Disease)} to ${newLevel}`;
      }
    }

    // Check for win
    this.state.hasWon = this.state.diseases.every((level: number | null) => level === null);
    
    if (!this.state.hasWon && !this.state.hasLost) {
      this.startTurn();
    } else {
      this.state.message = this.state.hasWon ? 'You have won!!!' : 'Game Over';
    }

    this.notifyListeners();
  }

  // Confirm treatment (handle re-rolls or apply)
  confirmTreatment(): void {
    if (this.state.rerollsRemaining <= 0) {
      this.applyTreatment();
    } else {
      this.rollTreatment();
      this.state.rerollsRemaining--;
      
      if (this.state.rerollsRemaining <= 0) {
        // Auto-save all dice when no re-rolls remain
        this.state.savedTreatmentDice = [true, true, true, true, true];
        this.state.message = 'No re-rolls remaining. Confirm treatment.';
      }
    }
    
    this.notifyListeners();
  }

  // Check if panic should be reduced
  private doesReducePanic(panicCount: number): boolean {
    const needCount = this.state.currentRole === Role.PREXPERT 
      ? PR_DICE_TO_REDUCE_PANIC 
      : NORMAL_DICE_TO_REDUCE_PANIC;
    
    return this.state.panicLevel > 0 && panicCount >= needCount;
  }

  // Check if disease should be cured
  private doesCureDisease(disease: Disease, counts: DiseaseCounts): boolean {
    const count = counts[disease];
    const needCount = 4;
    
    if (count >= needCount) return true;
    
    // PR Expert can cure with 3-of-a-kind
    if (this.state.currentRole === Role.PREXPERT && count >= 3) {
      return true;
    }
    
    // Scientist can cure with full house (3 of one + 2 of another)
    if (this.state.currentRole === Role.SCIENTIST) {
      if (count < 3) return false;
      
      for (let otherDisease = 0; otherDisease < 6; otherDisease++) {
        if (otherDisease !== disease && counts[otherDisease as Disease] === 2) {
          return true;
        }
      }
    }
    
    return false;
  }

  // Check for game over conditions
  private checkGameOver(): void {
    // Check disease levels
    for (let disease = 0; disease < DISEASE_COUNT; disease++) {
      const level = this.state.diseases[disease];
      if (level !== null && level !== undefined && level >= LOSING_LEVEL) {
        this.state.hasLost = true;
        return;
      }
    }
    
    // Check panic level
    if (this.state.panicLevel >= LOSING_LEVEL) {
      this.state.hasLost = true;
    }
  }

  // Get number of re-rolls allowed
  private getRerollsAllowed(): number {
    return this.state.currentRole === Role.RESEARCHER 
      ? REROLLS_ALLOWED + 1 
      : REROLLS_ALLOWED;
  }

  // Reset game
  resetGame(): void {
    this.state = this.createInitialState();
    this.startTurn();
  }

  // Get current state
  getState(): GameState {
    return { ...this.state };
  }

  // Utility methods for UI
  getDiseaseName(disease: Disease): string {
    const names = ['Avian Flu', 'Swine Flu', 'SARS', 'Smallpox', 'Ebola', 'Panic!'];
    return names[disease] || 'Unknown';
  }

  getRoleName(role: Role): string {
    const names = ['Medic', 'Researcher', 'PR Expert', 'Scientist', 'Epidemiologist', 'Bio-terrorist'];
    return names[role] || 'Unknown';
  }

  getRoleDescription(role: Role): string {
    const descriptions = [
      'Avoid one disease level increase',
      'Get an extra treatment roll',
      'Cure disease with 3-of-a-kind',
      'Cure disease with Full House',
      'Re-roll Panics without penalty',
      'All disease levels increase'
    ];
    return descriptions[role] || 'Unknown role';
  }

  getDiseaseImage(disease: Disease): string {
    const images = ['avian.png', 'swine.png', 'sars.png', 'smallpox.png', 'ebola.png', 'panic.png'];
    return images[disease] || 'unknown.png';
  }

  getRoleImage(role: Role): string {
    const images = ['medic.png', 'researcher.png', 'prexpert.png', 'scientist.png', 'epidemiologist.png', 'bioterrorist.png'];
    return images[role] || 'unknown.png';
  }
}