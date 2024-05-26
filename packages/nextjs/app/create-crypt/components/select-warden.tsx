import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~~/components/ui/select";

export type Warden = {
  name: string;
  address: string;
  nillionUserKey: string;
};

export function SelectWarden(props: {
  selectedWardenAddress: string | undefined;
  onSelect: (wardenAddress: string) => void;
  wardens: Warden[];
}) {
  return (
    <Select value={props.selectedWardenAddress} onValueChange={props.onSelect}>
      <SelectTrigger className="w-full text-xs">
        <SelectValue placeholder="Warden" className="text-xs">
          {props.selectedWardenAddress || "Select warden"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {props.wardens.map(warden => (
          <SelectItem key={warden.address} value={warden.address} className="text-xs">
            {warden.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
