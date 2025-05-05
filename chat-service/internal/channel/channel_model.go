package channel

type ChannelModel struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `json:"name"`
	Host string `json:"host"`
}
