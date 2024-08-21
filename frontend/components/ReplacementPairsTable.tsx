import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ReplacementPair {
  searchString: string;
  replaceString: string;
}

interface ReplacementPairsTableProps {
  pairs: ReplacementPair[];
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onEditPair: (
    index: number,
    field: "searchString" | "replaceString",
    value: string
  ) => void;
  onRemovePair: (index: number) => void;
}

export const ReplacementPairsTable: React.FC<ReplacementPairsTableProps> = ({
  pairs,
  searchTerm,
  onSearchTermChange,
  onEditPair,
  onRemovePair,
}) => {
  const filteredPairs = pairs.filter(
    (pair) =>
      pair.searchString.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pair.replaceString.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4 relative">
        <Input
          type="text"
          placeholder="Search replacement pairs..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="max-w-sm pr-10"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Search String</TableHead>
            <TableHead>Replace String</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPairs.map((pair, index) => (
            <TableRow key={index}>
              <TableCell>{pair.searchString}</TableCell>
              <TableCell>
                <Input
                  value={pair.replaceString}
                  onChange={(e) =>
                    onEditPair(index, "replaceString", e.target.value)
                  }
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemovePair(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
