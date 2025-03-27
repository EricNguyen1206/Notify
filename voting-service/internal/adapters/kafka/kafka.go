package kafka

import (
	"github.com/IBM/sarama"
)

func InitKafkaProducer(brokers []string, topic string) (sarama.SyncProducer, error) {
	config := sarama.NewConfig()
	config.Producer.RequiredAcks = sarama.WaitForAll
	config.Producer.Retry.Max = 5
	config.Producer.Return.Successes = true
	config.Producer.Compression = sarama.CompressionSnappy  // Enable compression
	config.Producer.Partitioner = sarama.NewHashPartitioner // Consistent hashing
	config.Producer.Partitioner(topic)
	config.Version = sarama.V2_0_0_0
	config.ClientID = "voting-service"
	config.Producer.MaxMessageBytes = 1000000 // 1MB (adjust as needed)
	config.Producer.Flush.MaxMessages = 1000  // Flush every 1000 messages (adjust as needed)

	producer, err := sarama.NewSyncProducer(brokers, config)
	if err != nil {
		return nil, err
	}

	return producer, nil
}
