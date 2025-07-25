/**
 * Import component contract:
 *
 * - (Planned) Allows user to import cards from a JSON file.
 * - Handles file reading, validation, and calls addCard with valid cards.
 * - Pure presentational; does not manage persistence or parent state.
 */
/**
 * Import component contract:
 *
 * - (Planned) Allows user to import cards from a JSON file.
 * - Handles file reading, validation, and calls addCard with valid cards.
 * - Pure presentational; does not manage persistence or parent state.
 */
function Import() {
  // const [newCard, setNewCard] = useState({
  //   character: "",
  //   pinyin: "",
  //   meaning: "",
  //   sentence: "",
  //   sentencePinyin: "",
  //   sentenceMeaning: "",
  // });
  // const fileInputRef = useRef<HTMLInputElement>(null);
  // const handleImport = importCardsFromJson(addCard);
  return (
    <div>
      <h2>Import Component</h2>
      {/*  
          <button onClick={() => fileInputRef.current?.click()}>
            Import JSON
          </button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleImport}
          /> */}
    </div>
  );
}

// function importCardsFromJson(addCard: (card: Card | Card[]) => void) {
//   return (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         try {
//           const json = JSON.parse(event.target?.result as string);
//           if (Array.isArray(json)) {
//             const validCards = json.filter(
//               (card) =>
//                 card.character &&
//                 card.pinyin &&
//                 card.meaning &&
//                 card.sentence &&
//                 card.sentencePinyin &&
//                 card.sentenceMeaning,
//             );
//             if (validCards.length > 0) {
//               addCard(validCards);
//             } else {
//               alert("No valid cards found in JSON.");
//             }
//           } else {
//             alert("Invalid JSON format. Expected an array of cards.");
//           }
//         } catch (error) {
//           console.error("Error parsing JSON file:", error);
//           alert("Error parsing JSON file.");
//         }
//         // Reset file input
//         e.target.value = "";
//       };
//       reader.readAsText(file);
//     }
//   };
// }
