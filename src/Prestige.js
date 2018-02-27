import {deleteActiveScriptsItem}                from "./ActiveScriptsUI.js";
import {Augmentations, augmentationExists,
        initAugmentations, AugmentationNames}   from "./Augmentations.js";
import {initBitNodeMultipliers}                 from "./BitNode.js";
import {Companies, Company, initCompanies}      from "./Company.js";
import {Programs}                               from "./CreateProgram.js";
import {Engine}                                 from "./engine.js";
import {Factions, Faction, initFactions,
        joinFaction}                            from "./Faction.js";
import {Locations}                              from "./Location.js";
import {initMessages, Messages, Message}        from "./Message.js";
import {initSingularitySFFlags, hasWallStreetSF}from "./NetscriptFunctions.js";
import {WorkerScript, workerScripts,
        prestigeWorkerScripts}                  from "./NetscriptWorker.js";
import {Player}                                 from "./Player.js";
import {AllServers, AddToAllServers,
        initForeignServers, Server,
        prestigeAllServers,
        prestigeHomeComputer}                   from "./Server.js";
import {SpecialServerIps, SpecialServerIpsMap,
        prestigeSpecialServerIps,
        SpecialServerNames}                     from "./SpecialServerIps.js";
import {initStockMarket, initSymbolToStockMap,
        stockMarketContentCreated,
        setStockMarketContentCreated}           from "./StockMarket.js";
import {Terminal, postNetburnerText}            from "./Terminal.js";
import Decimal                                  from '../utils/decimal.js';
import {dialogBoxCreate}                        from "../utils/DialogBox.js";

//Prestige by purchasing augmentation
function prestigeAugmentation() {
    initBitNodeMultipliers();

    Player.prestigeAugmentation();

    //Delete all Worker Scripts objects
    prestigeWorkerScripts();

    var homeComp = Player.getHomeComputer();
    //Delete all servers except home computer
    prestigeAllServers();

    //Delete Special Server IPs
    prestigeSpecialServerIps(); //Must be done before initForeignServers()

    //Reset home computer (only the programs) and add to AllServers
    prestigeHomeComputer(homeComp);

    if (augmentationExists(AugmentationNames.Neurolink) &&
        Augmentations[AugmentationNames.Neurolink].owned) {
        homeComp.programs.push(Programs.FTPCrackProgram);
        homeComp.programs.push(Programs.RelaySMTPProgram);
    }
    if (augmentationExists(AugmentationNames.CashRoot) &&
        Augmentations[AugmentationNames.CashRoot].owned) {
        Player.setMoney(new Decimal(1000000));
        homeComp.programs.push(Programs.BruteSSHProgram);
    }

    AddToAllServers(homeComp);

    //Re-create foreign servers
    initForeignServers();

    //Darkweb is purchase-able
    document.getElementById("location-purchase-tor").setAttribute("class", "a-link-button");

    //Gain favor for Companies
    for (var member in Companies) {
        if (Companies.hasOwnProperty(member)) {
            Companies[member].gainFavor();
        }
    }

    //Gain favor for factions
    for (var member in Factions) {
        if (Factions.hasOwnProperty(member)) {
            Factions[member].gainFavor();
        }
    }

    //Stop a Terminal action if there is onerror
    if (Engine._actionInProgress) {
        Engine._actionInProgress = false;
        Terminal.finishAction(true);
    }

    //Re-initialize things - This will update any changes
    initFactions(); //Factions must be initialized before augmentations
    initAugmentations(); //Calls reapplyAllAugmentations() and resets Player multipliers
    Player.reapplyAllSourceFiles();
    initCompanies();

    //Clear terminal
    $("#terminal tr:not(:last)").remove();
    postNetburnerText();

    //Messages
    initMessages();

    //Reset Stock market
    if (Player.hasWseAccount) {
        initStockMarket();
        initSymbolToStockMap();
    }
    setStockMarketContentCreated(false);
    var stockMarketList = document.getElementById("stock-market-list");
    while(stockMarketList.firstChild) {
        stockMarketList.removeChild(stockMarketList.firstChild);
    }

    //Gang, in BitNode 2
    if (Player.bitNodeN == 2 && Player.inGang()) {
        var faction = Factions[Player.gang.facName];
        if (faction instanceof Faction) {
            joinFaction(faction);
        }
    }

    //BitNode 3: Corporatocracy
    if (Player.bitNodeN === 3) {Player.money = new Decimal(150e9);}

    //BitNode 8: Ghost of Wall Street
    if (Player.bitNodeN === 8) {Player.money = new Decimal(100e6);}
    if (Player.bitNodeN === 8 || hasWallStreetSF) {
        Player.hasWseAccount = true;
        Player.hasTixApiAccess = true;
    }

    var mainMenu = document.getElementById("mainmenu-container");
    mainMenu.style.visibility = "visible";
    Terminal.resetTerminalInput();
    Engine.loadTerminalContent();

    //Red Pill
    if (augmentationExists(AugmentationNames.TheRedPill) &&
        Augmentations[AugmentationNames.TheRedPill].owned) {
        var WorldDaemon = AllServers[SpecialServerIps[SpecialServerNames.WorldDaemon]];
        var DaedalusServer = AllServers[SpecialServerIps[SpecialServerNames.DaedalusServer]];
        if (WorldDaemon && DaedalusServer) {
            WorldDaemon.serversOnNetwork.push(DaedalusServer.ip);
            DaedalusServer.serversOnNetwork.push(WorldDaemon.ip);
        }
    }
}


//Prestige by destroying Bit Node and gaining a Source File
function prestigeSourceFile() {
    initBitNodeMultipliers();

    Player.prestigeSourceFile();
    prestigeWorkerScripts(); //Delete all Worker Scripts objects

    var homeComp = Player.getHomeComputer();

    //Delete all servers except home computer
    prestigeAllServers(); //Must be done before initForeignServers()

    //Delete Special Server IPs
    prestigeSpecialServerIps();

    //Reset home computer (only the programs) and add to AllServers
    prestigeHomeComputer(homeComp);

    var srcFile1Owned = false;
    for (var i = 0; i < Player.sourceFiles.length; ++i) {
        if (Player.sourceFiles[i].n == 1) {
            srcFile1Owned = true;
        }
    }
    if (srcFile1Owned) {
        homeComp.setMaxRam(32);
    } else {
        homeComp.setMaxRam(8);
    }
    homeComp.cpuCores = 1;

    AddToAllServers(homeComp);

    //Re-create foreign servers
    initForeignServers();

    //Darkweb is purchase-able
    document.getElementById("location-purchase-tor").setAttribute("class", "a-link-button");

    //Reset favor for Companies
    for (var member in Companies) {
        if (Companies.hasOwnProperty(member)) {
            Companies[member].favor = 0;
        }
    }

    //Reset favor for factions
    for (var member in Factions) {
        if (Factions.hasOwnProperty(member)) {
            Factions[member].favor = 0;
        }
    }

    //Stop a Terminal action if there is one
    if (Engine._actionInProgress) {
        Engine._actionInProgress = false;
        Terminal.finishAction(true);
    }

    //Delete all Augmentations
    for (var name in Augmentations) {
        if (Augmentations.hasOwnProperty(name)) {
            delete Augmentations[name];
        }
    }

    //Re-initialize things - This will update any changes
    initFactions(); //Factions must be initialized before augmentations
    initAugmentations();    //Calls reapplyAllAugmentations() and resets Player multipliers
    Player.reapplyAllSourceFiles();
    initCompanies();

    //Clear terminal
    $("#terminal tr:not(:last)").remove();
    postNetburnerText();

    //Messages
    initMessages();

    var mainMenu = document.getElementById("mainmenu-container");
    mainMenu.style.visibility = "visible";
    Terminal.resetTerminalInput();
    Engine.loadTerminalContent();

    //Reinitialize Bit Node flags
    initSingularitySFFlags();

    //Reset Stock market, gang, and corporation
    if (Player.hasWseAccount) {
        initStockMarket();
        initSymbolToStockMap();
    }
    setStockMarketContentCreated(false);
    var stockMarketList = document.getElementById("stock-market-list");
    while(stockMarketList.firstChild) {
        stockMarketList.removeChild(stockMarketList.firstChild);
    }

    Player.gang = null;
    Player.corporation = null;


    //BitNode 3, get Handbook .lit file
    homeComp.messages.push("corporation-management-handbook.lit");
    dialogBoxCreate("You received a copy of the Corporation Management Handbook on your home computer. " +
                    "Read it if you need help getting started with Corporations!");

    //Gain int exp
    Player.gainIntelligenceExp(5);
}

export {prestigeAugmentation, prestigeSourceFile};
