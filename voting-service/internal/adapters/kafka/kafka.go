package kafka

import (
	"github.com/IBM/sarama"
)

func InitKafkaProducer(brokers []string) (sarama.SyncProducer, error) {
	config := sarama.NewConfig()
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Retry.Max = 5
	config.Producer.Return.Successes = true
	config.Producer.Compression = sarama.CompressionSnappy  // Enable compression
	config.Producer.Partitioner = sarama.NewHashPartitioner // Consistent hashing

	producer, err := sarama.NewSyncProducer(brokers, config)
	if err != nil {
		return nil, err
	}

	return producer, nil
}
