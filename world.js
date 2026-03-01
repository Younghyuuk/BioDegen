class World {
    constructor(gameEngine) {
        gameEngine.World = this;
        this.game = gameEngine;
        // this.world = [];
        this.currentVillage = null;
       
        this.Trow = 0;
        this.Tcol = 0;
        
        // this.data = new DataManager(this);
    
        this.run = -1;
        
        this.buildWorld();
       
    };

    buildWorld() {
        // 1) Clear out the old entities but keep this.World
        this.game.entities = [];
        this.game.addEntity(this);
    
        // 2) Reset your data manager / graphs
        this.data = new DataManager(this);
        // this.game.addEntity(this);  
    
        // 3) Reset simulation day
        PARAMETERS.day = 0;
        document.getElementById("day").innerText = `Day: 0`;
    
        // 4) Recreate your grid of Villages
        this.world = [];
        for (let i = 0; i < PARAMETERS.worldDimension; i++) {
            this.world.push([]);
          for (let j = 0; j < PARAMETERS.worldDimension; j++) {
            this.world[i].push(new Village(this, i, j));
          }
        }
    
        // 5) Re‑add your global graphs
        this.humanGraph = new Graph(this.game, 1020, 10, this,
                                    [this.data.popGraph], "Population", ["population"]);
        this.game.addEntity(this.humanGraph);
    
        this.ticketGraph = new Graph(this.game, 1020, 210, this,
                                     [this.data.socialGraph, this.data.learningGraph, this.data.geneGraph],
                                     "Combined tickets", ["social T","learning T","gene traits"]);
        this.game.addEntity(this.ticketGraph);
      }

    updateData() {
        this.humanPop = 0;
        let totalLearningTAverage = 0;
        let totalSocialTAverage = 0;
        let totalAvgTraits = 0;
        let villageCount = 0;
        
        this.data.updateHistogramData();

        for (let i = 0; i < PARAMETERS.worldDimension; i++) {
            for (let j = 0; j < PARAMETERS.worldDimension; j++) {
                let villagePop = this.world[i][j].population.length;
                this.humanPop += villagePop;
                if (villagePop > 0) {
                    let learningT = 0, socialT = 0, geneTraits = 0;
                    for (let k = 0; k < villagePop; k++) {
                        let agent = this.world[i][j].population[k];
                        let genesLength = agent.genes.length;
                        if (genesLength >= 2) {
                            learningT += agent.genes[genesLength - 2];
                            socialT += agent.genes[genesLength - 1];
                            let sumOfFirstTenGenes = agent.genes.slice(0, 10).reduce((acc, curr) => acc + curr, 0);
                            geneTraits += sumOfFirstTenGenes/10; // Add this sum to geneTraits
                        }
                    }
                    // Averages for this village
                    totalLearningTAverage += learningT / villagePop;
                    totalSocialTAverage += socialT / villagePop;
                    totalAvgTraits += geneTraits / villagePop;
                    villageCount++;
                }
                 // village data testing
                this.world[i][j].updateVillageData();
            }
        }
    
        // Overall average across villages
        this.data.learningGraph.push(villageCount > 0 ? totalLearningTAverage / villageCount : 0);
        this.data.socialGraph.push(villageCount > 0 ? totalSocialTAverage / villageCount : 0);
        this.data.geneGraph.push(villageCount > 0 ? totalAvgTraits / villageCount : 0);
        this.data.popGraph.push(this.humanPop); // Total population


        // village data testing
        // for(let i = 0; i < PARAMETERS.worldDimension; i++) {
        //     for(let j = 0; j < PARAMETERS.worldDimension; j++) {
        //         this.world[i][j].updateVillageData();
        //     }
        // }

        this.updateGraph();
        
    };
    
 

    update() {
        document.getElementById("day").innerHTML = `Day: ${++PARAMETERS.day}`;
        for(let i = 0; i < PARAMETERS.worldDimension; i++) {
            for(let j = 0; j < PARAMETERS.worldDimension; j++) {
                this.world[i][j].update();
            }
        }
        if (PARAMETERS.day % PARAMETERS.reportingPeriod === 0) {
            this.updateData();
        }
        
        if (this.game.click) {
            this.handleClickOnVillage(this.game.ctx);
            setTimeout(() => {
                this.game.click = false; // Reset the click state
            }, 10); 
        }
        if(PARAMETERS.day % PARAMETERS.epoch === 0) {
            this.data.logData(this.currentVillage);
            // Reminder this reset after we logdata to MongoDB is to make sure the world starts over 
            // and we don't have data accumulating past the amount of epoch(days) we want causing us to not be able to pull later cause of the sheer amount of data.
            this.reset();
        }
    };

    handleClickOnVillage(ctx) {
        const cellWidth = ctx.canvas.height / PARAMETERS.worldDimension;
        const cellHeight = ctx.canvas.height / PARAMETERS.worldDimension;
        const clickX = this.game.clickCoords.x;
        const clickY = this.game.clickCoords.y;

        const col = Math.floor(clickX / cellWidth);
        const row = Math.floor(clickY / cellHeight);

        this.Tcol = col;
        this.Trow = row;    

        if (row >= 0 && row < PARAMETERS.worldDimension && col >= 0 && col < PARAMETERS.worldDimension) {
            
            if (this.currentVillage) {
                this.currentVillage.isSelected = false; // Deselect the previous village
            }
            this.currentVillage = this.world[col][row];
            this.currentVillage.isSelected = true; // Select the new village
           
            
            // data manager update
            // this.data.logData(this.currentVillage);

            this.updateGraph(); // Update the graph to reflect new data
            console.log(`Village at ${col}, ${row} was clicked.`);      
           
        }
    }

    reset() {
        this.nextRun();
        loadParameters();
        this.buildWorld();
    }
    
    nextRun() {
            const thresHoldStep = document.getElementById("ReproThresholdStep");
        
            const runName = document.getElementById("run");
            const learnOn = document.getElementById("learningOn");
            const socialOn = document.getElementById("socialOn");
            const learningRateInput  = document.getElementById("learnRate");   // ← grab it
            const mutationRate = document.getElementById("mutationRate");

            // update params
            this.run = (this.run + 1) % runs.length;
            Object.assign(PARAMETERS, runs[this.run]);
        
            // update HTML
            runName.innerHTML = PARAMETERS.run;
            thresHoldStep.value = PARAMETERS.reproductionThresholdStep;
            // for new on values for learn and social tickets after 50,000 days and 100,000 days
            learnOn.value = PARAMETERS.learningOn;
            socialOn.value = PARAMETERS.socialOn;
            learningRateInput.value    = PARAMETERS.learningRate; 
            mutationRate.value = PARAMETERS.mutationRate;
    }
   
    
    updateGraph() {
        // Clear existing graph if any
        if (this.villageGraph) {
            const index = this.game.entities.indexOf(this.villageGraph);
            if (index > -1) {
                this.game.entities.splice(index, 1);
            }
        }

        // Assuming villageGraph is a method of the village
        if (this.currentVillage) {
            this.villageGraph = new Graph(this.game, 1020, 500, this.currentVillage,
                [this.currentVillage.villageLearning, this.currentVillage.villageSocial, this.currentVillage.villageAverageGenes],
                `Village (Col: ${this.Tcol}, Row: ${this.Trow})`, ["learning T", "social T", "gene traits"]);
            this.game.entities.push(this.villageGraph);
        }
    }

    draw(ctx){
        ctx.fillStyle = "#cc9966";
        ctx.fillRect(0,0,ctx.canvas.height,ctx.canvas.height);

        for(let i = 0; i < PARAMETERS.worldDimension; i++) {
            for(let j = 0; j < PARAMETERS.worldDimension; j++) {
                this.world[i][j].draw(ctx);
            }
        }

      
    };
};
