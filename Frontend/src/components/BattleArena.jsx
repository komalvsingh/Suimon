import { useState, useEffect } from "react";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient } from "@mysten/sui.js/client";
import { ConnectButton } from "@suiet/wallet-kit";
import { LazyLoadImage } from "react-lazy-load-image-component";

const TESTNET_CLIENT = new SuiClient({
  url: "https://fullnode.testnet.sui.io",
});
const CONTRACT_ADDRESS =
  "0x70217963607936caee034ce016fb2e9be0debc644d13a6ac40d955940e1066a7"; // Replace with your actual package ID where the smart contract is deployed

const BattleArena = ({ wallet }) => {
  const [creatures, setCreatures] = useState([]);
  const [selectedCreature, setSelectedCreature] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [training, setTraining] = useState(false);
  const [trainingAmount, setTrainingAmount] = useState(10);

  // Difficulty levels and their corresponding XP rewards
  const difficultyLevels = [
    { name: "Easy", xp: 10, color: "green" },
    { name: "Medium", xp: 25, color: "yellow" },
    { name: "Hard", xp: 50, color: "orange" },
    { name: "Expert", xp: 100, color: "red" },
  ];

  useEffect(() => {
    if (wallet.connected && wallet.account) {
      fetchUserCreatures();
    } else {
      setCreatures([]);
      setSelectedCreature(null);
    }
  }, [wallet.connected, wallet.account]);

  const fetchUserCreatures = async () => {
    if (!wallet.connected || !wallet.account) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const nfts = await TESTNET_CLIENT.getOwnedObjects({
        owner: wallet.account.address,
        options: {
          showContent: true,
          showType: true,
          showDisplay: true,
        },
      });

      if (!nfts.data || nfts.data.length === 0) {
        setError("No digital collectibles found in your wallet.");
        setCreatures([]);
        return;
      }

      // Filter for creatures that match our contract type
      const filteredCreatures = nfts.data.filter((obj) => {
        const type = obj.data?.type;
        return (
          type &&
          (type.includes("starter_nft") ||
            type.includes("suimon") ||
            type.includes("creature"))
        );
      });

      if (filteredCreatures.length === 0) {
        setError("No trainable creatures found in your wallet.");
        setCreatures([]);
        return;
      }

      // Process the creature data
      const processedCreatures = filteredCreatures.map((nft) => {
        const data = nft.data;
        const content = data.content?.fields || {};
        const display = data.display?.data?.fields || {};

        return {
          id: data.objectId,
          name: content.name || display.name || "Unnamed Creature",
          image: content.image_url || display.image_url || "",
          experience: content.experience || 0,
          level: content.evolution_stage || 0,
          power: content.power || content.experience || 0,
          elementType: getElementType(content.pokemon_id || 0),
        };
      });

      setCreatures(processedCreatures);
      if (processedCreatures.length > 0) {
        setSelectedCreature(processedCreatures[0]);
      }
    } catch (err) {
      console.error("Error loading collectibles:", err);
      setError(`Failed to load your digital collectibles: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getElementType = (id) => {
    const numId = parseInt(id);
    if (numId >= 1 && numId <= 3) return "nature";
    if (numId >= 4 && numId <= 6) return "flame";
    if (numId >= 7 && numId <= 9) return "aqua";
    return "normal";
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "nature":
        return "bg-green-500/20 text-green-500";
      case "flame":
        return "bg-red-500/20 text-red-500";
      case "aqua":
        return "bg-blue-500/20 text-blue-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  const startTraining = async (difficultyXp) => {
    if (!selectedCreature || !wallet.connected) return;

    setTraining(true);
    setError("");
    setSuccess("");
    setTrainingAmount(difficultyXp);

    try {
      // Create a transaction block
      const txb = new TransactionBlock();

      // Call the gain_experience function on the smart contract
      txb.moveCall({
        target: `${CONTRACT_ADDRESS}::starter_nft::gain_experience`,
        arguments: [
          txb.object(selectedCreature.id), // NFT object ID
          txb.pure(difficultyXp), // Experience amount to gain
        ],
      });

      // Execute the transaction
      const { response } = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: txb,
      });

      console.log("Training transaction successful:", response);
      setSuccess(
        `Training complete! Your creature gained ${difficultyXp} experience points.`
      );

      // Update the selected creature's experience locally
      setSelectedCreature({
        ...selectedCreature,
        experience: selectedCreature.experience + difficultyXp,
      });

      // Refresh the creature list to get updated data from the blockchain
      setTimeout(() => {
        fetchUserCreatures();
      }, 2000);
    } catch (err) {
      console.error("Training transaction failed:", err);
      setError(`Training failed: ${err.message}`);
    } finally {
      setTraining(false);
    }
  };

  const calculateProgress = (exp) => {
    // Calculate progress percentage toward next evolution
    if (exp < 100) return (exp / 100) * 100; // Progress to first evolution
    if (exp < 300) return ((exp - 100) / 200) * 100; // Progress to second evolution
    return 100; // Max evolution reached
  };

  const getEvolutionStage = (level, exp) => {
    if (level >= 2) return "Final Form";
    if (level === 1) return "Evolved Form";
    return "Basic Form";
  };

  const getProgressToNextLevel = (exp) => {
    if (exp < 100) return `${exp}/100 XP to evolve`;
    if (exp < 300) return `${exp}/300 XP to final form`;
    return "Maximum evolution reached";
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      {!wallet.connected ? (
        <div className="bg-surface p-6 rounded-lg shadow text-center">
          <h2 className="text-xl font-bold mb-4">Training Arena</h2>
          <p className="mb-4">
            Connect your wallet to train your creatures and help them grow
            stronger.
          </p>
          <ConnectButton />
        </div>
      ) : isLoading ? (
        <div className="bg-surface p-6 rounded-lg shadow text-center">
          <p>Loading your creatures...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-500/10 border border-red-500 p-4 rounded-lg text-red-500 mb-4">
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500 p-4 rounded-lg text-green-500 mb-4">
              <p>{success}</p>
            </div>
          )}

          <div className="bg-surface p-6 rounded-lg shadow mb-4">
            <h2 className="text-xl font-bold mb-4">Training Arena</h2>
            <p className="text-gray-400 mb-6">
              Select a creature to train and choose a difficulty level. Higher
              difficulties grant more experience points!
            </p>

            {/* Creature Selection */}
            {creatures.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2">Select Creature</h3>
                <div className="flex overflow-x-auto gap-3 pb-2">
                  {creatures.map((creature) => (
                    <button
                      key={creature.id}
                      onClick={() => setSelectedCreature(creature)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ${
                        selectedCreature?.id === creature.id
                          ? "ring-2 ring-primary"
                          : "opacity-70"
                      }`}
                    >
                      {creature.image ? (
                        <img
                          src={creature.image}
                          alt={creature.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <span className="text-xs">
                            {creature.name.substring(0, 3)}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center mb-6">
                <p>You don't have any trainable creatures yet.</p>
              </div>
            )}

            {/* Selected Creature Details */}
            {selectedCreature && (
              <div className="bg-gray-800 rounded-lg overflow-hidden mb-6">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 p-4 flex flex-col items-center">
                    <div className="w-full aspect-square mb-4 rounded-lg overflow-hidden bg-gray-700">
                      {selectedCreature.image ? (
                        <LazyLoadImage
                          src={selectedCreature.image}
                          alt={selectedCreature.name}
                          className="w-full h-full object-contain"
                          placeholder={
                            <div className="w-full h-full bg-gray-600 animate-pulse" />
                          }
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl font-bold mb-1">
                      {selectedCreature.name}
                    </h2>
                    <span
                      className={`px-2 py-1 rounded text-xs mb-3 ${getTypeColor(
                        selectedCreature.elementType
                      )}`}
                    >
                      {selectedCreature.elementType}
                    </span>

                    <div className="w-full">
                      <div className="text-sm text-gray-400 flex justify-between mb-1">
                        <span>
                          {getEvolutionStage(
                            selectedCreature.level,
                            selectedCreature.experience
                          )}
                        </span>
                        <span>
                          {getProgressToNextLevel(selectedCreature.experience)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${calculateProgress(
                              selectedCreature.experience
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="bg-gray-700 p-2 rounded text-center">
                        <p className="text-xs text-gray-400">Form</p>
                        <p className="font-bold">{selectedCreature.level}</p>
                      </div>
                      <div className="bg-gray-700 p-2 rounded text-center">
                        <p className="text-xs text-gray-400">XP</p>
                        <p className="font-bold">
                          {selectedCreature.experience}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="md:w-2/3 p-6">
                    <h3 className="text-lg font-bold mb-4">Training Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {difficultyLevels.map((level) => (
                        <button
                          key={level.name}
                          onClick={() => startTraining(level.xp)}
                          disabled={training}
                          className={`p-4 rounded-lg bg-gray-700 hover:bg-gray-600 flex flex-col items-center justify-center transition-all ${
                            training && trainingAmount === level.xp
                              ? "ring-2 ring-primary animate-pulse"
                              : ""
                          }`}
                        >
                          <span
                            className={`text-${level.color}-500 font-bold text-lg`}
                          >
                            {level.name}
                          </span>
                          <span className="text-sm text-gray-400 mt-1">
                            Gain {level.xp} XP
                          </span>
                        </button>
                      ))}
                    </div>

                    {training && (
                      <div className="mt-6 text-center">
                        <p className="text-primary animate-pulse">
                          Training in progress...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={fetchUserCreatures}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md text-white"
              >
                Refresh Creatures
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BattleArena;
