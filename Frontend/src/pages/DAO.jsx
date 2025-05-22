import React, { useState, useEffect, useCallback } from 'react';
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { ConnectButton, useWallet } from '@mysten/wallet-adapter-react';
import { 
  Wallet, 
  Users, 
  Plus, 
  Vote, 
  Coins, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Send,
  UserPlus,
  Settings,
  Eye,
  Calendar,
  DollarSign
} from 'lucide-react';

const MemeDAOInterface = () => {
  const { connected, account, signAndExecuteTransactionBlock } = useWallet();
  const [suiClient, setSuiClient] = useState(null);
  const [daos, setDaos] = useState([]);
  const [selectedDao, setSelectedDao] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [createDaoForm, setCreateDaoForm] = useState({
    name: '',
    description: '',
    members: [''],
    threshold: 1,
    initialFunds: 0
  });
  
  const [proposalForm, setProposalForm] = useState({
    type: 'transfer',
    title: '',
    description: '',
    targetAddress: '',
    targetUsername: '',
    amount: 0,
    newMember: ''
  });
  
  const [usernameForm, setUsernameForm] = useState({
    username: ''
  });
  
  const [tipForm, setTipForm] = useState({
    recipient: '',
    amount: 0,
    useUsername: false
  });

  // Contract configuration
  const PACKAGE_ID = process.env.REACT_APP_PACKAGE_ID || "0x..."; // Replace with actual package ID
  const REGISTRY_ID = process.env.REACT_APP_REGISTRY_ID || "0x..."; // Replace with actual registry ID
  const COIN_TYPE = "0x2::sui::SUI"; // Using SUI as default, can be configurable

  useEffect(() => {
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    setSuiClient(client);
  }, []);

  useEffect(() => {
    if (connected && suiClient) {
      fetchUserDAOs();
    }
  }, [connected, suiClient, account]);

  const fetchUserDAOs = useCallback(async () => {
    if (!suiClient || !account?.address) return;
    
    setLoading(true);
    try {
      // Fetch DAOs where user is a member
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: {
          MatchAll: [
            {
              StructType: `${PACKAGE_ID}::meme_dao::MemeDAO<${COIN_TYPE}>`
            }
          ]
        },
        options: {
          showContent: true,
          showType: true
        }
      });

      const daoData = ownedObjects.data.map(obj => ({
        id: obj.data.objectId,
        ...obj.data.content.fields
      }));

      setDaos(daoData);
    } catch (err) {
      console.error('Error fetching DAOs:', err);
      setError('Failed to fetch DAOs');
    } finally {
      setLoading(false);
    }
  }, [suiClient, account, PACKAGE_ID]);

  const fetchProposals = useCallback(async (daoId) => {
    if (!suiClient || !daoId) return;
    
    try {
      // Fetch dynamic fields (proposals) from the DAO object
      const dynamicFields = await suiClient.getDynamicFields({
        parentId: daoId
      });

      const proposalData = await Promise.all(
        dynamicFields.data.map(async (field) => {
          const proposal = await suiClient.getDynamicFieldObject({
            parentId: daoId,
            name: {
              type: 'u64',
              value: field.name.value
            }
          });
          return {
            id: field.name.value,
            ...proposal.data.content.fields
          };
        })
      );

      setProposals(proposalData);
    } catch (err) {
      console.error('Error fetching proposals:', err);
    }
  }, [suiClient]);

  const createDAO = async () => {
    if (!connected || !suiClient) return;
    
    setLoading(true);
    try {
      const tx = new TransactionBlock();
      
      // Convert initial funds to coin object if needed
      let initialFundsCoin;
      if (createDaoForm.initialFunds > 0) {
        const coins = await suiClient.getCoins({
          owner: account.address,
          coinType: COIN_TYPE
        });
        
        if (coins.data.length === 0) {
          throw new Error('No coins available');
        }
        
        initialFundsCoin = tx.object(coins.data[0].coinObjectId);
      } else {
        // Create a zero-value coin
        initialFundsCoin = tx.splitCoins(tx.gas, [tx.pure(0)]);
      }

      tx.moveCall({
        target: `${PACKAGE_ID}::meme_dao::create_dao`,
        typeArguments: [COIN_TYPE],
        arguments: [
          tx.object(REGISTRY_ID),
          tx.pure(Array.from(new TextEncoder().encode(createDaoForm.name))),
          tx.pure(Array.from(new TextEncoder().encode(createDaoForm.description))),
          tx.pure(createDaoForm.members.filter(m => m.trim() !== '')),
          tx.pure(createDaoForm.threshold),
          initialFundsCoin,
          tx.object('0x6') // Clock object
        ]
      });

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
          showEffects: true,
          showEvents: true
        }
      });

      if (result.effects?.status?.status === 'success') {
        setCreateDaoForm({
          name: '',
          description: '',
          members: [''],
          threshold: 1,
          initialFunds: 0
        });
        await fetchUserDAOs();
        setActiveTab('overview');
      }
    } catch (err) {
      console.error('Error creating DAO:', err);
      setError(`Failed to create DAO: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const registerUsername = async () => {
    if (!connected || !suiClient || !selectedDao) return;
    
    setLoading(true);
    try {
      const tx = new TransactionBlock();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::meme_dao::register_username_in_dao`,
        typeArguments: [COIN_TYPE],
        arguments: [
          tx.object(selectedDao.id),
          tx.pure(Array.from(new TextEncoder().encode(usernameForm.username)))
        ]
      });

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
          showEffects: true,
          showEvents: true
        }
      });

      if (result.effects?.status?.status === 'success') {
        setUsernameForm({ username: '' });
        setError('Username registered successfully!');
      }
    } catch (err) {
      console.error('Error registering username:', err);
      setError(`Failed to register username: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createProposal = async () => {
    if (!connected || !suiClient || !selectedDao) return;
    
    setLoading(true);
    try {
      const tx = new TransactionBlock();
      
      const titleBytes = Array.from(new TextEncoder().encode(proposalForm.title));
      const descBytes = Array.from(new TextEncoder().encode(proposalForm.description));

      if (proposalForm.type === 'transfer') {
        tx.moveCall({
          target: `${PACKAGE_ID}::meme_dao::create_transfer_proposal`,
          typeArguments: [COIN_TYPE],
          arguments: [
            tx.object(selectedDao.id),
            tx.pure(titleBytes),
            tx.pure(descBytes),
            tx.pure(proposalForm.targetAddress),
            tx.pure(proposalForm.amount),
            tx.object('0x6') // Clock object
          ]
        });
      } else if (proposalForm.type === 'username_transfer') {
        tx.moveCall({
          target: `${PACKAGE_ID}::meme_dao::create_username_transfer_proposal`,
          typeArguments: [COIN_TYPE],
          arguments: [
            tx.object(selectedDao.id),
            tx.pure(titleBytes),
            tx.pure(descBytes),
            tx.pure(Array.from(new TextEncoder().encode(proposalForm.targetUsername))),
            tx.pure(proposalForm.amount),
            tx.object('0x6') // Clock object
          ]
        });
      } else if (proposalForm.type === 'add_member') {
        tx.moveCall({
          target: `${PACKAGE_ID}::meme_dao::create_add_member_proposal`,
          typeArguments: [COIN_TYPE],
          arguments: [
            tx.object(selectedDao.id),
            tx.pure(titleBytes),
            tx.pure(descBytes),
            tx.pure(proposalForm.newMember),
            tx.object('0x6') // Clock object
          ]
        });
      }

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
          showEffects: true,
          showEvents: true
        }
      });

      if (result.effects?.status?.status === 'success') {
        setProposalForm({
          type: 'transfer',
          title: '',
          description: '',
          targetAddress: '',
          targetUsername: '',
          amount: 0,
          newMember: ''
        });
        await fetchProposals(selectedDao.id);
      }
    } catch (err) {
      console.error('Error creating proposal:', err);
      setError(`Failed to create proposal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const voteOnProposal = async (proposalId, voteFor) => {
    if (!connected || !suiClient || !selectedDao) return;
    
    setLoading(true);
    try {
      const tx = new TransactionBlock();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::meme_dao::vote_proposal`,
        typeArguments: [COIN_TYPE],
        arguments: [
          tx.object(selectedDao.id),
          tx.pure(proposalId),
          tx.pure(voteFor),
          tx.object('0x6') // Clock object
        ]
      });

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
          showEffects: true,
          showEvents: true
        }
      });

      if (result.effects?.status?.status === 'success') {
        await fetchProposals(selectedDao.id);
      }
    } catch (err) {
      console.error('Error voting on proposal:', err);
      setError(`Failed to vote: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const executeProposal = async (proposalId) => {
    if (!connected || !suiClient || !selectedDao) return;
    
    setLoading(true);
    try {
      const tx = new TransactionBlock();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::meme_dao::execute_proposal`,
        typeArguments: [COIN_TYPE],
        arguments: [
          tx.object(selectedDao.id),
          tx.object(REGISTRY_ID),
          tx.pure(proposalId),
          tx.object('0x6') // Clock object
        ]
      });

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
          showEffects: true,
          showEvents: true
        }
      });

      if (result.effects?.status?.status === 'success') {
        await fetchProposals(selectedDao.id);
      }
    } catch (err) {
      console.error('Error executing proposal:', err);
      setError(`Failed to execute proposal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const tipCreator = async () => {
    if (!connected || !suiClient || !selectedDao) return;
    
    setLoading(true);
    try {
      const tx = new TransactionBlock();
      
      if (tipForm.useUsername) {
        tx.moveCall({
          target: `${PACKAGE_ID}::meme_dao::tip_creator_by_username`,
          typeArguments: [COIN_TYPE],
          arguments: [
            tx.object(selectedDao.id),
            tx.pure(Array.from(new TextEncoder().encode(tipForm.recipient))),
            tx.pure(tipForm.amount)
          ]
        });
      } else {
        tx.moveCall({
          target: `${PACKAGE_ID}::meme_dao::tip_creator`,
          typeArguments: [COIN_TYPE],
          arguments: [
            tx.object(selectedDao.id),
            tx.pure(tipForm.recipient),
            tx.pure(tipForm.amount)
          ]
        });
      }

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
          showEffects: true,
          showEvents: true
        }
      });

      if (result.effects?.status?.status === 'success') {
        setTipForm({ recipient: '', amount: 0, useUsername: false });
        setError('Tip sent successfully!');
      }
    } catch (err) {
      console.error('Error sending tip:', err);
      setError(`Failed to send tip: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addMemberToForm = () => {
    setCreateDaoForm(prev => ({
      ...prev,
      members: [...prev.members, '']
    }));
  };

  const updateMember = (index, value) => {
    setCreateDaoForm(prev => ({
      ...prev,
      members: prev.members.map((member, i) => i === index ? value : member)
    }));
  };

  const removeMember = (index) => {
    setCreateDaoForm(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-8">Meme DAO</h1>
          <ConnectButton className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <header className="border-b border-purple-800 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Meme DAO</h1>
          <div className="flex items-center gap-4">
            <ConnectButton />
            {account && (
              <span className="text-sm opacity-75">
                {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className={`mb-4 p-4 rounded-lg ${error.includes('success') ? 'bg-green-600/20 border border-green-600' : 'bg-red-600/20 border border-red-600'}`}>
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-4 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mb-8">
          <nav className="flex space-x-1 bg-black/30 p-1 rounded-lg">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'create', label: 'Create DAO', icon: Plus },
              { id: 'proposals', label: 'Proposals', icon: Vote },
              { id: 'username', label: 'Username', icon: Users },
              { id: 'tip', label: 'Tip Creator', icon: DollarSign }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your DAOs</h2>
              <button
                onClick={fetchUserDAOs}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {daos.map(dao => (
                <div 
                  key={dao.id}
                  className="bg-black/30 backdrop-blur-sm border border-purple-800 rounded-xl p-6 hover:bg-black/40 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedDao(dao);
                    fetchProposals(dao.id);
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">{dao.name}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs ${dao.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                      {dao.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-4 line-clamp-2">{dao.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Members:</span>
                      <span>{dao.members?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Treasury:</span>
                      <span>{dao.treasury || 0} SUI</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Threshold:</span>
                      <span>{dao.voting_threshold}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {daos.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No DAOs Found</h3>
                <p className="text-gray-400 mb-4">Create your first DAO to get started</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create DAO
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Create New DAO</h2>
            
            <div className="bg-black/30 backdrop-blur-sm border border-purple-800 rounded-xl p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">DAO Name</label>
                <input
                  type="text"
                  value={createDaoForm.name}
                  onChange={(e) => setCreateDaoForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="Enter DAO name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={createDaoForm.description}
                  onChange={(e) => setCreateDaoForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none h-24"
                  placeholder="Describe your DAO"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Initial Members</label>
                {createDaoForm.members.map((member, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={member}
                      onChange={(e) => updateMember(index, e.target.value)}
                      className="flex-1 px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                      placeholder="0x..."
                    />
                    {createDaoForm.members.length > 1 && (
                      <button
                        onClick={() => removeMember(index)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addMemberToForm}
                  className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Member
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Voting Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={createDaoForm.threshold}
                    onChange={(e) => setCreateDaoForm(prev => ({ ...prev, threshold: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Initial Funds (SUI)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={createDaoForm.initialFunds}
                    onChange={(e) => setCreateDaoForm(prev => ({ ...prev, initialFunds: parseFloat(e.target.value) }))}
                    className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={createDAO}
                disabled={loading || !createDaoForm.name || createDaoForm.members.filter(m => m.trim()).length < 3}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Creating...' : 'Create DAO'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'proposals' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Proposals</h2>
              {selectedDao && (
                <div className="text-sm text-gray-400">
                  DAO: {selectedDao.name}
                </div>
              )}
            </div>

            {!selectedDao ? (
              <div className="text-center py-12">
                <Vote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Select a DAO</h3>
                <p className="text-gray-400">Choose a DAO from the overview to view and create proposals</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {proposals.map(proposal => (
                    <div key={proposal.id} className="bg-black/30 backdrop-blur-sm border border-purple-800 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{proposal.title}</h3>
                          <p className="text-gray-400 text-sm">#{proposal.id}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs ${
                          proposal.executed ? 'bg-green-600/20 text-green-400' : 
                          proposal.votes_for >= selectedDao.voting_threshold ? 'bg-blue-600/20 text-blue-400' : 
                          'bg-yellow-600/20 text-yellow-400'
                        }`}>
                          {proposal.executed ? 'Executed' : 
                           proposal.votes_for >= selectedDao.voting_threshold ? 'Passed' : 'Voting'}
                        </div>
                      </div>

                      <p className="text-gray-300 mb-4">{proposal.description}</p>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">For:</span>
                          <span className="text-green-400">{proposal.votes_for}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Against:</span>
                          <span className="text-red-400">{proposal.votes_against}</span>
                        </div>
                        {proposal.amount > 0 && (
                          <div className="flex justify-between col-span-2">
                            <span className="text-gray-400">Amount:</span>
                            <span>{proposal.amount} SUI</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {!proposal.executed && (
                          <>
                            <button
                              onClick={() => voteOnProposal(proposal.id, true)}
                              disabled={loading}
                              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Vote For
                            </button>
                            <button
                              onClick={() => voteOnProposal(proposal.id, false)}
                              disabled={loading}
                              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Vote Against
                            </button>
                          </>
                        )}
                        {!proposal.executed && proposal.votes_for >= selectedDao.voting_threshold && (
                          <button
                            onClick={() => executeProposal(proposal.id)}
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-6 py-2 rounded-lg font-medium transition-colors"
                          >
                            Execute
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {proposals.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No proposals yet</p>
                    </div>
                  )}
                </div>

                <div className="bg-black/30 backdrop-blur-sm border border-purple-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Create Proposal</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Proposal Type</label>
                      <select
                        value={proposalForm.type}
                        onChange={(e) => setProposalForm(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                      >
                        <option value="transfer">Transfer Funds</option>
                        <option value="username_transfer">Transfer to Username</option>
                        <option value="add_member">Add Member</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Title</label>
                      <input
                        type="text"
                        value={proposalForm.title}
                        onChange={(e) => setProposalForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                        placeholder="Proposal title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={proposalForm.description}
                        onChange={(e) => setProposalForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none h-20"
                        placeholder="Describe your proposal"
                      />
                    </div>

                    {proposalForm.type === 'transfer' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">Target Address</label>
                          <input
                            type="text"
                            value={proposalForm.targetAddress}
                            onChange={(e) => setProposalForm(prev => ({ ...prev, targetAddress: e.target.value }))}
                            className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                            placeholder="0x..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Amount (SUI)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={proposalForm.amount}
                            onChange={(e) => setProposalForm(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                            className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </>
                    )}

                    {proposalForm.type === 'username_transfer' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">Target Username</label>
                          <input
                            type="text"
                            value={proposalForm.targetUsername}
                            onChange={(e) => setProposalForm(prev => ({ ...prev, targetUsername: e.target.value }))}
                            className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                            placeholder="username"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Amount (SUI)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={proposalForm.amount}
                            onChange={(e) => setProposalForm(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                            className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </>
                    )}

                    {proposalForm.type === 'add_member' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">New Member Address</label>
                        <input
                          type="text"
                          value={proposalForm.newMember}
                          onChange={(e) => setProposalForm(prev => ({ ...prev, newMember: e.target.value }))}
                          className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                          placeholder="0x..."
                        />
                      </div>
                    )}

                    <button
                      onClick={createProposal}
                      disabled={loading || !proposalForm.title || !proposalForm.description}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      {loading ? 'Creating...' : 'Create Proposal'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'username' && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6">Register Username</h2>
            
            {!selectedDao ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Select a DAO</h3>
                <p className="text-gray-400">Choose a DAO from the overview to register a username</p>
              </div>
            ) : (
              <div className="bg-black/30 backdrop-blur-sm border border-purple-800 rounded-xl p-6 space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">{selectedDao.name}</h3>
                  <p className="text-gray-400 text-sm">Register your username in this DAO</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <input
                    type="text"
                    value={usernameForm.username}
                    onChange={(e) => setUsernameForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="Enter your username"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This username will be unique within this DAO
                  </p>
                </div>

                <button
                  onClick={registerUsername}
                  disabled={loading || !usernameForm.username}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Registering...' : 'Register Username'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tip' && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6">Tip Creator</h2>
            
            {!selectedDao ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Select a DAO</h3>
                <p className="text-gray-400">Choose a DAO from the overview to send tips</p>
              </div>
            ) : (
              <div className="bg-black/30 backdrop-blur-sm border border-purple-800 rounded-xl p-6 space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">{selectedDao.name}</h3>
                  <p className="text-gray-400 text-sm">
                    Treasury: {selectedDao.treasury || 0} SUI
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Max tip: {Math.floor((selectedDao.treasury || 0) / 100)} SUI (1% of treasury)
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="recipientType"
                        checked={!tipForm.useUsername}
                        onChange={() => setTipForm(prev => ({ ...prev, useUsername: false, recipient: '' }))}
                        className="text-purple-600"
                      />
                      <span className="text-sm">Address</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="recipientType"
                        checked={tipForm.useUsername}
                        onChange={() => setTipForm(prev => ({ ...prev, useUsername: true, recipient: '' }))}
                        className="text-purple-600"
                      />
                      <span className="text-sm">Username</span>
                    </label>
                  </div>

                  <label className="block text-sm font-medium mb-2">
                    {tipForm.useUsername ? 'Username' : 'Recipient Address'}
                  </label>
                  <input
                    type="text"
                    value={tipForm.recipient}
                    onChange={(e) => setTipForm(prev => ({ ...prev, recipient: e.target.value }))}
                    className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder={tipForm.useUsername ? "username" : "0x..."}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount (SUI)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    max={Math.floor((selectedDao.treasury || 0) / 100)}
                    value={tipForm.amount}
                    onChange={(e) => setTipForm(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                    className="w-full px-4 py-2 bg-black/50 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={tipCreator}
                  disabled={loading || !tipForm.recipient || tipForm.amount <= 0}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Sending...' : 'Send Tip'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemeDAOInterface;