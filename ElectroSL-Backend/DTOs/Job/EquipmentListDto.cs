namespace ElectroSL_Backend.DTOs.Job;

public class EquipmentListDto
{
    public int JobId { get; set; }
    public List<EquipmentItemDto> Items { get; set; } = new();
}

public class EquipmentItemDto
{
    public int CatalogItemId { get; set; }
    public int Quantity { get; set; }
    public decimal ClaimedPrice { get; set; }
}