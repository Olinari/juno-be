import toxicity from "@tensorflow-models/toxicity";

export const measureToxicity = async (sentence) => {
  const status = { offensiveMessage: false, labels: [] };
  const threshold = 0.3;

  const model = await toxicity.load(threshold);
  const predictions = await model.classify(sentence);
  console.log(JSON.stringify(predictions));
  predictions.forEach((prediction) => {
    if (prediction.results[0].match) {
      status.offensiveMessage = true;
      status.labels.push(prediction.label);
    }
  });

  return status;
};
