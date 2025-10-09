/*
*  Epidemic Express, Copyright 2010 by Kevin B. Smith
* 
* TODO:
* - Try reducing panic on each cure
* - Try clearing panic on any 5-of-a-kind
* - Try medic reducing infection dice by 1 or 2
* - Strike-through cured disease names
*/

dojo.require("dijit.form.Button");
dojo.require("dijit.Dialog");

var startNewGameDialog

var iconSize = 30                               // 30
var rerollsAllowed = 2                          // 2
var initialInfectionRate = 3                    // 3
var maxInfectionRate = 7                        // 7
var diceToIncreasePanic = 2                     // 2
var normalDiceToReducePanic = 4                 // 4
var reducePanicOnCure = false                   // false
var prDiceToReducePanic = 3                     // 3
var reduceOthersWhenReducingPanic = true        // true
var prExpertCanAvoidPanicIncrease = false       // false
var bioterroristIncreasesPanic = false          // false
var bioterroristIncreasesDiseases = true        // true
var penaltyForRerollingPanics = true            // true
var epidemiologistReducesInfectionDice = false  // false

var MEDIC = 0
var RESEARCHER = 1
var PREXPERT = 2
var SCIENTIST = 3
var EPIDEMIOLOGIST = 4
var BIOTERRORIST = 5

var AVIAN = 0
var SWINE = 1
var SARS = 2
var SMALLPOX = 3
var EBOLA = 4
var DISEASE_COUNT = 5

var PANIC = 5

var LOSING_LEVEL = 6

var rerollsRemaining = 0
var infectionRate = 0
var currentRole = 0

var levels = [0,0,0,0,0,0]
var hasWon = false
var hasLost = false

var infectionDice = []
var treatmentDice = [0,0,0,0,0]
var saveTreatmentDice = [false, false, false, false, false]

getSquareImageTag = function(image, size)
{
    return "<img src='" + image + "' width='" + size + "' height='" + size + "'></img>";
}

function roll(sides)
{
	var rawRandom = Math.floor(Math.random()*sides);
	return rawRandom;
}

showSection = function(sectionId)
{
    dojo.byId(sectionId).style.display = "";
}

hideSection = function(sectionId)
{
    dojo.byId(sectionId).style.display = "none";
}

showLevel = function(disease, level)
{
    levelIndicator = dojo.byId("level" + disease)
    if(level == null)
    {
        levelImageName = "shot.png"
    }
    else if(level >= LOSING_LEVEL)
    {
        levelImageName = "lost.png"
    }
    else
    {
        levelImageName = (level+1) + ".png"
    }
    size = iconSize
    levelIndicator.innerHTML=getSquareImageTag(levelImageName, size)
}

hideDie = function(dieId)
{
    dojo.byId(dieId).innerHTML = '';
}

showDie = function(dieId, imageName)
{
    dojo.byId(dieId).innerHTML = getSquareImageTag(imageName, iconSize);
}

showMessage = function(message)
{
    dojo.byId("UserMessage").innerHTML = message;
}

getRandomDiseaseImage = function()
{
    return getDiseaseImageName(roll(6))
}

getDiseaseImageName = function(disease)
{
    switch(disease)
    {
        case AVIAN: return "avian.png"; break;
        case SWINE: return "swine.png"; break;
        case SARS: return "sars.png"; break;
        case SMALLPOX: return "smallpox.png"; break;
        case EBOLA: return "ebola.png"; break;
        case PANIC: return "panic.png"; break;
    }

}

getDiseaseName = function(disease)
{
    switch(disease)
    {
        case AVIAN: return "Avian Flu"; break;
        case SWINE: return "Swine Flu"; break;
        case SARS: return "SARS"; break;
        case SMALLPOX: return "Smallpox"; break;
        case EBOLA: return "Ebola"; break;
        case PANIC: return "Panic!"; break;
    }
}

getCurrentRoleDetails = function()
{
    prExpertDescription = prExpertCanAvoidPanicIncrease ? "No panic increase during infection" : "Reduce panic on 3-of-a-kind"
    switch(currentRole)
    {
        case MEDIC:             return ["Medic", "medic.png", "Avoid one disease level increase"]; break;
        case PREXPERT:          return ["PR Expert", "prexpert.png", prExpertDescription]; break;
        case RESEARCHER:        return ["Researcher", "researcher.png", "Get an extra treatment roll"]; break;
        case SCIENTIST:         return ["Scientist", "scientist.png", "Cure disease with Full House"]; break;
        case EPIDEMIOLOGIST:    return ["Epidemiologist", "epidemiologist.png", "Re-roll Panics without penalty"]; break;
        case BIOTERRORIST:      return ["Bio-terrorist", "bioterrorist.png", "All disease levels increase"]; break;
    }
}

getCurrentRoleName = function()
{
    return getCurrentRoleDetails()[0]
}

getCurrentRoleImage = function()
{
    return getCurrentRoleDetails()[1]
}

getCurrentRoleDescription = function()
{
    return getCurrentRoleDetails()[2]
}

getRerollsAllowed = function()
{
    if(currentRole == RESEARCHER)
        return rerollsAllowed + 1

    return rerollsAllowed
}

showRole = function()
{
    dojo.byId("CurrentRoleName").innerHTML = getCurrentRoleName()
    dojo.byId("CurrentRoleImage").innerHTML = getSquareImageTag(getCurrentRoleImage(), iconSize)
    dojo.byId("CurrentRoleDescription").innerHTML = getCurrentRoleDescription()
}

startTurn = function()
{
    showSection("InfectionPanel")
    hideSection("TreatmentPanel")
    currentRole = roll(6)
    showRole()
    rerollsRemaining = getRerollsAllowed();
    rollInfection()
}

applyInfection = function()
{
    var increase = [false, false, false, false, false, false]

    var panicDice = 0
    var diseaseGettingInfectedWithHighestLevel = -1
    var highestLevelOfAnyDiseaseGettingInfected = -1
    for(var die = 0; die < infectionDice.length; die += 1)
    {
        var infected = infectionDice[die]
        if(infected == PANIC)
            panicDice += 1
        else
        {
            if((levels[infected] != null) && (levels[infected] > highestLevelOfAnyDiseaseGettingInfected) )
            {
                diseaseGettingInfectedWithHighestLevel = infected
                highestLevelOfAnyDiseaseGettingInfected = levels[infected]
            }
            increase[infected] = true
        }
    }

    if(currentRole == MEDIC && diseaseGettingInfectedWithHighestLevel >= 0)
    {
        increase[diseaseGettingInfectedWithHighestLevel] = false
        showMessage("Medic avoided infection of " + getDiseaseName(diseaseGettingInfectedWithHighestLevel))
    }

    for(var disease = 0; disease < DISEASE_COUNT; ++disease)
    {
        if(levels[disease] == null)
            continue

        willIncreaseLevel = increase[disease]
        if(currentRole == BIOTERRORIST && bioterroristIncreasesDiseases)
            willIncreaseLevel = true

        if(willIncreaseLevel)
            levels[disease] += 1
    }

    canIncreasePanic = true
    if(currentRole == BIOTERRORIST)
        canIncreasePanic = false
    if(prExpertCanAvoidPanicIncrease && (currentRole == PREXPERT) )
        canIncreasePanic = false

    shouldIncreasePanic = false
    if(panicDice >= diceToIncreasePanic)
        shouldIncreasePanic = true
    if(bioterroristIncreasesPanic && (currentRole == BIOTERRORIST) )
        shouldIncreasePanic = true

    if(canIncreasePanic && shouldIncreasePanic)
        levels[PANIC] += 1

    for(disease = 0; disease < DISEASE_COUNT; ++disease)
        if(levels[disease] >= LOSING_LEVEL)
            hasLost = true
    if(levels[PANIC] >= LOSING_LEVEL)
        hasLost = true

    if(hasLost)
    {
        showLost()
    }
    showLevels()
}

rollInfection = function()
{
    infectionDiceCount = infectionRate
    if(epidemiologistReducesInfectionDice && (currentRole == EPIDEMIOLOGIST) )
        infectionDiceCount -= 1
    infectionDice = new Array(infectionDiceCount)

    for(var i = 0; i < infectionRate; i += 1)
    {
        infectionDice[i] = roll(6)
    }

    showInfectionDice()
}

confirmInfection = function()
{
    applyInfection()
    hideSection("InfectionPanel")
    showSection("TreatmentPanel")
    dojo.byId("ConfirmTreatment").innerHTML = "Re-roll Treatment";

    for(var i = 0; i < saveTreatmentDice.length; ++i)
    {
        treatmentDice[i] = 0
        saveTreatmentDice[i] = false
    }

    rollTreatment();

    showMessage("Choose which treatment dice to keep")
}

rollTreatment = function()
{
    for(var i = 0; i < treatmentDice.length; i += 1)
        if(!saveTreatmentDice[i])
        {
            isEpidemiologist = (currentRole == EPIDEMIOLOGIST)
            penaltyForRerolling = (penaltyForRerollingPanics && !isEpidemiologist)
            if(penaltyForRerolling && (treatmentDice[i] == PANIC) )
                levels[PANIC] += 1
            treatmentDice[i] = roll(6)
            var autoSave = false
            if(penaltyForRerolling && (treatmentDice[i] == PANIC) )
                autoSave = true
            saveTreatmentDice[i] = autoSave
        }
    showTreatmentDice()
    showLevels()
}

getCountsByDisease = function(dice)
{
    counts = [0,0,0,0,0,0]
    for(var i = 0; i < dice.length; i += 1)
        counts[dice[i]] += 1
    return counts
}

doesReducePanic = function(count)
{
    needCount = (currentRole == PREXPERT) ? prDiceToReducePanic : normalDiceToReducePanic
    return ( (levels[PANIC] > 0) && (count >= needCount) )
}

doesCureDisease = function(disease, counts)
{
    if(levels[disease] == null)
        return false

    var count = counts[disease]
    var needCount = 4
    if(count >= needCount)
        return true

    if(currentRole != SCIENTIST)
        return false

    needCount = 3
    if(count < needCount)
        return false

    for(var otherDisease = 0; otherDisease < counts.length; ++otherDisease)
        if(counts[otherDisease] == 2)
            return true

    return false
}

applyTreatment = function()
{
    showMessage("")
    var countsByDisease = getCountsByDisease(treatmentDice)
    willReducePanic = doesReducePanic(countsByDisease[PANIC])
    if(willReducePanic)
    {
        levels[PANIC] -= 1
        showMessage("Reduced Panic!")
        if(!reduceOthersWhenReducingPanic)
        {
            showLevels()
            return
        }
    }

    for(var disease = 0; disease < countsByDisease.length; ++disease)
    {
        if(disease == PANIC)
            continue
        if(levels[disease] == null)
            continue

        var count = countsByDisease[disease]
        if(doesCureDisease(disease, countsByDisease))
        {
            levels[disease] = null
            if(infectionRate < maxInfectionRate)
                infectionRate += 1
            showMessage("Cured " + getDiseaseName(disease) + "!")
            if(reducePanicOnCure && levels[PANIC] > 0)
                levels[PANIC] -= 1
        }
        else if(count > 0)
        {
            var newLevel = levels[disease] -= count
            if(newLevel < 0)
                newLevel = 0
            levels[disease] = newLevel
            showMessage("Reduced " + getDiseaseName(disease) + " to " + levels[disease])
        }
    }

    hasWon = true
    for(disease = 0; disease < DISEASE_COUNT; ++disease)
        if(levels[disease] != null)
            hasWon = false

    if(hasWon && !hasLost)
        showWon()

    showLevels()
}

confirmTreatment = function()
{
    if(rerollsRemaining <= 0)
    {
        applyTreatment()
        showSection("InfectionPanel")
        hideSection("TreatmentPanel")
        startTurn()
    }
    else
    {
        rollTreatment();
        rerollsRemaining -= 1;
        if(rerollsRemaining <= 0)
        {
            for(var die = 0; die < saveTreatmentDice.length; ++die)
                saveTreatmentDice[die] = true
            showTreatmentDice()
            dojo.byId("ConfirmTreatment").innerHTML = "Confirm Treatment";
        }
    }
}

showLevels = function()
{
    showLevel(0, levels[AVIAN])
    showLevel(1, levels[SWINE])
    showLevel(2, levels[SARS])
    showLevel(3, levels[SMALLPOX])
    showLevel(4, levels[EBOLA])

    showLevel(5, levels[PANIC])
}

showInfectionDice = function()
{
    for(var i = 0; i < maxInfectionRate; i += 1)
        hideDie("Infection" + i);

    for(var i = 0; i < infectionDice.length; i += 1)
        showDie("Infection" + i, getDiseaseImageName(infectionDice[i]));
}

showTreatmentDice = function()
{
    for(var dieNumber = 0; dieNumber < treatmentDice.length; dieNumber += 1)
    {
        showDie("Treatment" + dieNumber, getDiseaseImageName(treatmentDice[dieNumber]));
        if(saveTreatmentDice[dieNumber])
            dojo.byId("TreatmentCross" + dieNumber).innerHTML=getSquareImageTag("checkmark.png", iconSize)
        else
            dojo.byId("TreatmentCross" + dieNumber).innerHTML=""
    }
}

saveDie0 = function() { saveDie(0) }
saveDie1 = function() { saveDie(1) }
saveDie2 = function() { saveDie(2) }
saveDie3 = function() { saveDie(3) }
saveDie4 = function() { saveDie(4) }

saveDie = function(dieNumber)
{
    if(rerollsRemaining <= 0)
        return

    saveTreatmentDice[dieNumber] = saveTreatmentDice[dieNumber] ? false : true
    if(saveTreatmentDice[dieNumber])
    {
        showMessage("Saving die " + (dieNumber+1) + ": " + getDiseaseName(treatmentDice[dieNumber]))
    }
    else
    {
        showMessage("Rerolling die " + (dieNumber+1) + ": " + getDiseaseName(treatmentDice[dieNumber]))
    }
    showTreatmentDice()
}

showRules = function()
{
    window.open ("rules.html","rules");
}

startNewGame = function()
{
    content = "Are you sure you want to start a new game?<br/>" +
        "<button id='Yes' type='button' onclick='resetGame(); startNewGameDialog.hide()'>Yes</button>" +
        "<button id='No' type='button' onclick='startNewGameDialog.hide();'>No</button>"
    
    startNewGameDialog.attr("content", content);
    startNewGameDialog.show();
}

showLost = function()
{
    content = "You have lost.<br/>Start another game?<br/>" +
        "<button id='Yes' type='button' onclick='resetGame(); lostDialog.hide()'>Yes</button>" +
        "<button id='No' type='button' onclick='lostDialog.hide();'>No</button>"
    
    lostDialog.attr("content", content);
    lostDialog.show();
}

showWon = function()
{
    content = "You have won!!!<br/>Start another game?<br/>" +
        "<button id='Yes' type='button' onclick='resetGame(); wonDialog.hide()'>Yes</button>" +
        "<button id='No' type='button' onclick='wonDialog.hide();'>No</button>"
    
    wonDialog.attr("content", content);
    wonDialog.show();
}

resetGame = function()
{
    rerollsRemaining = 0
    infectionRate = initialInfectionRate
    currentRole = 0

    levels = [0,0,0,0,0,0]
    hasWon = false
    hasLost = false

    infectionDice = []
    treatmentDice = [0,0,0,0,0]
    saveTreatmentDice = [false, false, false, false, false]

    showLevels()
    startTurn()
}

onLoad = function()
{
    rulesButtonAttributes =
    {
        type: "button",
        onClick: showRules,
    }
    var rulesButton = new dijit.form.Button(rulesButtonAttributes, "Rules");
    dojo.byId("Rules").innerHTML = "Show Rules"

    newGameButtonAttributes =
    {
        type: "button",
        onClick: startNewGame,
    }
    var newGameButton = new dijit.form.Button(newGameButtonAttributes, "NewGame");
    dojo.byId("NewGame").innerHTML = "Start New Game"

    confirmInfectionButtonAttributes =
    {
        type: "button",
        onClick: confirmInfection,
    }
    var confirmInfectionButton = new dijit.form.Button(confirmInfectionButtonAttributes, "ConfirmInfection");
    dojo.byId("ConfirmInfection").innerHTML = "Confirm Infection"

    confirmTreatmentButtonAttributes =
    {
        type: "button",
        onClick: confirmTreatment,
    }
    var confirmTreatmentButton = new dijit.form.Button(confirmTreatmentButtonAttributes, "ConfirmTreatment");

    startNewGameDialog = new dijit.Dialog({
        title: "Start New Game?",
        style: "width: 200px"
    });

    lostDialog = new dijit.Dialog({
        title: "Game Over",
        style: "width: 200px"
    });

    wonDialog = new dijit.Dialog({
        title: "Game Over",
        style: "width: 200px"
    });

    dojo.connect(dojo.byId("Treatment0"), "onclick", saveDie0)
    dojo.connect(dojo.byId("TreatmentCross0"), "onclick", saveDie0)
    dojo.connect(dojo.byId("Treatment1"), "onclick", saveDie1)
    dojo.connect(dojo.byId("TreatmentCross1"), "onclick", saveDie1)
    dojo.connect(dojo.byId("Treatment2"), "onclick", saveDie2)
    dojo.connect(dojo.byId("TreatmentCross2"), "onclick", saveDie2)
    dojo.connect(dojo.byId("Treatment3"), "onclick", saveDie3)
    dojo.connect(dojo.byId("TreatmentCross3"), "onclick", saveDie3)
    dojo.connect(dojo.byId("Treatment4"), "onclick", saveDie4)
    dojo.connect(dojo.byId("TreatmentCross4"), "onclick", saveDie4)

    resetGame()
}

dojo.addOnLoad(onLoad);
