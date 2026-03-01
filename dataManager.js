class DataManager {
    constructor(world) {
        this.world = world;

            // world
        this.popGraph = [];
        this.geneGraph = [];
        this.learningGraph = [];
        this.socialGraph = [];
            
            // village 2 dimensional
        this.villageLearning = [];
        this.villageSocial = [];
        this.villageAverageGenes = [];

        this.genesHistogramData = [];
        this.learningHistogramData = [];
        this.socialHistogramData = [];
        this.memeHistogramData = [];

        this.geneHistogram = new Histogram(1020, 600, this.genesHistogramData, {label: "Gene Distribution"});
        gameEngine.addEntity(this.geneHistogram);
        this.learningHistogram = new Histogram(1020, 700, this.learningHistogramData, {label: "Learning Trait Distribution"});
        gameEngine.addEntity(this.learningHistogram);
        this.socialHistogram = new Histogram(1020, 800, this.socialHistogramData, {label: "Social Trait Distribution"});
        gameEngine.addEntity(this.socialHistogram);
        this.memeHistogram = new Histogram(1020, 900, this.memeHistogramData, {label: "Meme Trait Distribution"});
        gameEngine.addEntity(this.memeHistogram);
    
        // this.villageLearning = Array.from({length: world.worldDimension}, () => []);
        // this.villageSocial = Array.from({length: world.worldDimension}, () => []);
        // this.villageAverageGenes = Array.from({length: world.worldDimension}, () => []);
   
    };

    logData(village) {
        // Parse through the data here for all villages
     // Iterate through each village to aggregate their data
        // Resetting village data arrays
        this.villageLearning = [];
        this.villageSocial = [];
        this.villageAverageGenes = [];

        // console.log(`Logging data for ${this.world.worldDimension * this.world.worldDimension} villages.`);
        // Aggregate data from each village
        for (let i = 0; i < this.world.world.length; i++) {
            for (let j = 0; j < this.world.world[i].length; j++) {
                let village = this.world.world[i][j];
                
                // debug here and see what is being pushed a list of time for each village list length should be the same for each should be 
                //  20 in each
                this.villageLearning.push(village.villageLearning);
                this.villageSocial.push(village.villageSocial);
                this.villageAverageGenes.push(village.villageAverageGenes);
                console.log(`Village (${i}, ${j}) - Learning: ${village.villageLearning.length}, Social: ${village.villageSocial.length}, Genes: ${village.villageAverageGenes.length}`);            }
        }
        // =============================================
        let data = {
            db: PARAMETERS.db,
            collection: PARAMETERS.collection,
            //maybe change this to query?
            data: {
                run: PARAMETERS.run,
                params: PARAMETERS,
                population: this.popGraph,
                geneTickets: this.geneGraph,
                learningTickets: this.learningGraph,
                socialTickets: this.socialGraph,
                geneHistogram: this.genesHistogramData,
                learningHistogram: this.learningHistogramData,
                socialHistogram: this.socialHistogramData,
                memeHistogram: this.memeHistogramData,
                //  pulls directly from the current village we have clicked and gets the data from that village 
                // instead of it just pushing one list of these tickets for one village we want all the villages and for each of these lists to be 
                //  a list of lists for every village

                // was flat previously
                villageLearning: this.villageLearning,
                villageSocial: this.villageSocial,
                villageGeneTraits: this.villageAverageGenes
                
            }
    
         }
    // Each list like popGraph, geneGraph, learningGraph, socialGraph should already be updated regularly in the world updates
         if (socket) socket.emit("insert", data);

         console.log(`Total villages logged: ${this.villageLearning.length}`);
    };

    updateHistogramData() {
        let geneHistogram = new Array(20).fill(0);
        let learningHistogram = new Array(20).fill(0);
        let socialHistogram = new Array(20).fill(0);
        let memeHistogram = new Array(20).fill(0);

        for (let i = 0; i < PARAMETERS.worldDimension; i++) {
            for (let j = 0; j < PARAMETERS.worldDimension; j++) {
                let village = this.world.world[i][j];
                village.allGeneValues.forEach(value => {
                    let index = Math.min(value, 19);
                    geneHistogram[index]++;
                });
                village.allLearningGeneValues.forEach(value => {
                    let index = Math.min(value, 19);
                    learningHistogram[index]++;
                });
                village.allSocialGeneValues.forEach(value => {
                    let index = Math.min(value, 19);
                    socialHistogram[index]++;
                });
                village.allMemeValues.forEach(value => {
                    let index = Math.min(value, 19);
                    memeHistogram[index]++;
                });
            }
        }

        this.genesHistogramData.push(geneHistogram);
        this.learningHistogramData.push(learningHistogram);
        this.socialHistogramData.push(socialHistogram);
        this.memeHistogramData.push(memeHistogram);
    }

    // make a function here called clearData()
    // clearData() {
    //     this.popGraph = [];
    //     this.geneGraph = [];
    //     this.learningGraph = [];
    //     this.socialGraph = [];
    //     this.geneTraits = [];
            
    //         // village 2 dimensional
    //     this.villageLearning = [];
    //     this.villageSocial = [];
    //     this.villageAverageGenes = [];
    // }


    // ======================================================================================================================================
    // TESTING LOGGING DATA


   // Testing out my averaging in graphs.js to see if it works properly filled with 1000 
    // logData(village) {
    //     let data = {
    //         db: PARAMETERS.db,
    //         collection: PARAMETERS.collection,
    //         data: {
    //             run: "testAVG", // Change to "testAVG2" if overwriting is an issue
    //             params: PARAMETERS,
    //             population: new Array(10).fill(1000),
    //             geneTickets: new Array(10).fill(1000),
    //             learningTickets: new Array(10).fill(1000),
    //             socialTickets: new Array(10).fill(1000),

    //             villageLearning: this.villageLearning,
    //             villageSocial: this.villageSocial,
    //             villageGeneTraits: this.villageAverageGenes
    //         }
    //     };

    //     console.log("Logging Data:", data);  // Verify data before sending
    //     socket.emit("insert", data);
    // }

    // testing with putting in 0s here
    // logData(village) {
    //     let data = {
    //         db: PARAMETERS.db,
    //         collection: PARAMETERS.collection,
    //         data: {
    //             run: "testAVG", // Change to "testAVG2" if overwriting is an issue
    //             params: PARAMETERS,
    //             population: new Array(10).fill(0),
    //             geneTickets: new Array(10).fill(0),
    //             learningTickets: new Array(10).fill(0),
    //             socialTickets: new Array(10).fill(0),

    //             villageLearning: this.villageLearning,
    //             villageSocial: this.villageSocial,
    //             villageGeneTraits: this.villageAverageGenes
    //         }
    //     };

    //     console.log("Logging Data:", data);  // Verify data before sending
    //     socket.emit("insert", data);
    // }
    

}