// This is just a basic ML algorithm utility class. I have not fully yet implemented it.
// Thus far I have created Mathematical utilities for ML algorithms
class MLUtils {
    static cosineSimilarity(vectorA, vectorB) {
      const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
      const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
      const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));
      return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
    }

    static pearsonCorrelation(x, y) {
      const n = x.length;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
      const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

      return denominator ? numerator / denominator : 0;
    }
    // Normalize array to 0-1 range
    static normalize(array) {
      const min = Math.min(...array);
      const max = Math.max(...array);
      const range = max - min;
      return range ? array.map(val => (val - min) / range) : array;
    }

    // vectors for text analysis
    static createTFIDF(documents) {
      const vocabulary = new Set();
      documents.forEach(doc => doc.forEach(word => vocabulary.add(word)));
      const vocabArray = Array.from(vocabulary);

      return documents.map(doc => {
        const tf = vocabArray.map(word => doc.filter(w => w === word).length / doc.length);
        const idf = vocabArray.map(word =>
          Math.log(documents.length / documents.filter(d => d.includes(word)).length)
        );
        return tf.map((t, i) => t * idf[i]);
      });
    }
  }

  module.exports = MLUtils;
