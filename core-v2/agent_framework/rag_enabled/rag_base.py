"""
RAG-Enabled Agent Base Class

This module provides the base class for agents with Retrieval-Augmented Generation (RAG)
capabilities enabled by default. RAG allows agents to retain and retrieve knowledge from
previous interactions, improving performance over time.

Usage:
    from core_v2.agent_framework.rag_enabled import RAGEnabledAgent

    class MyAgent(RAGEnabledAgent):
        def __init__(self):
            super().__init__(
                vector_db=Neo4jVectorDB(),
                enable_rag=True
            )
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Type
from dataclasses import dataclass
import warnings
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class RAGConfig:
    """Configuration for RAG system"""
    enabled: bool = True
    vector_db_type: str = "neo4j"  # neo4j, chroma, pinecone, weaviate
    collection_name: str = "agent_knowledge"
    top_k: int = 5  # Number of documents to retrieve
    chunk_size: int = 512  # Text chunk size for embeddings
    chunk_overlap: int = 50  # Overlap between chunks
    embedding_model: str = "text-embedding-ada-002"  # OpenAI embedding


@dataclass
class KnowledgeRetrievalResult:
    """Result from knowledge retrieval"""
    query: str
    documents: List[Dict[str, Any]]
    total_retrieved: int
    retrieval_time: float
    vector_db_used: str


class VectorDatabase:
    """Base class for vector database implementations"""

    async def search(
        self,
        query: str,
        top_k: int = 5,
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        raise NotImplementedError


class Neo4jVectorDB(VectorDatabase):
    """Neo4j-based vector database implementation"""

    def __init__(
        self,
        uri: str = "bolt://localhost:7687",
        username: str = "neo4j",
        password: str = "password",
        database: str = "neo4j"
    ):
        self.uri = uri
        self.username = username
        self.password = password
        self.database = database
        self.driver = None

    async def connect(self):
        """Establish connection to Neo4j"""
        try:
            from neo4j import AsyncGraphDatabase
            self.driver = AsyncGraphDatabase.driver(
                self.uri,
                auth=(self.username, self.password)
            )
            logger.info(f"Connected to Neo4j at {self.uri}")
        except ImportError:
            logger.warning("neo4j package not installed. RAG will be disabled.")
            self.driver = None
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            self.driver = None

    async def search(
        self,
        query: str,
        top_k: int = 5,
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search Neo4j for similar documents using vector similarity"""
        if not self.driver:
            logger.warning("Neo4j not connected, returning empty results")
            return []

        try:
            # Generate embedding for query
            query_embedding = await self._embed_text(query)

            # Cypher query for vector similarity search
            cypher_query = """
            CALL db.index.vector.queryNodes($index_name, $top_k, $query_embedding)
            YIELD node, score
            RETURN node.content AS content, node.metadata AS metadata, score
            """

            async with self.driver.session(database=self.database) as session:
                result = await session.run(
                    cypher_query,
                    index_name="agent_knowledge",
                    top_k=top_k,
                    query_embedding=query_embedding
                )

                documents = []
                async for record in result:
                    documents.append({
                        "content": record["content"],
                        "metadata": record["metadata"],
                        "score": record["score"]
                    })

                logger.info(f"Retrieved {len(documents)} documents from Neo4j")
                return documents

        except Exception as e:
            logger.error(f"Error searching Neo4j: {e}")
            return []

    async def _embed_text(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI"""
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI()

            response = await client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )

            return response.data[0].embedding

        except ImportError:
            logger.warning("OpenAI package not installed")
            return [0.0] * 1536  # Return zero embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return [0.0] * 1536

    async def add_document(
        self,
        content: str,
        metadata: Dict[str, Any],
        collection: str = "agent_knowledge"
    ):
        """Add a document to the knowledge base"""
        if not self.driver:
            logger.warning("Neo4j not connected, skipping document add")
            return

        try:
            # Generate embedding
            embedding = await self._embed_text(content)

            # Create node with embedding
            cypher_query = """
            CREATE (n:Document {
                collection: $collection,
                content: $content,
                metadata: $metadata,
                embedding: $embedding,
                created_at: datetime()
            })
            """

            async with self.driver.session(database=self.database) as session:
                await session.run(
                    cypher_query,
                    collection=collection,
                    content=content,
                    metadata=metadata,
                    embedding=embedding
                )

            logger.info(f"Added document to collection '{collection}'")

        except Exception as e:
            logger.error(f"Error adding document: {e}")

    async def close(self):
        """Close Neo4j connection"""
        if self.driver:
            await self.driver.close()
            logger.info("Neo4j connection closed")


class ChromaVectorDB(VectorDatabase):
    """ChromaDB-based vector database implementation"""

    def __init__(
        self,
        persist_directory: str = "./chroma_db",
        collection_name: str = "agent_knowledge"
    ):
        self.persist_directory = persist_directory
        self.collection_name = collection_name
        self.client = None
        self.collection = None

    async def connect(self):
        """Establish connection to ChromaDB"""
        try:
            import chromadb
            self.client = chromadb.PersistentClient(path=self.persist_directory)
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name
            )
            logger.info(f"Connected to ChromaDB at {self.persist_directory}")
        except ImportError:
            logger.warning("chromadb package not installed. RAG will be disabled.")
            self.client = None
        except Exception as e:
            logger.error(f"Failed to connect to ChromaDB: {e}")
            self.client = None

    async def search(
        self,
        query: str,
        top_k: int = 5,
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search ChromaDB for similar documents"""
        if not self.collection:
            logger.warning("ChromaDB not connected, returning empty results")
            return []

        try:
            # Generate embedding for query
            query_embedding = await self._embed_text(query)

            # Query ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=filter_dict
            )

            documents = []
            for i, doc in enumerate(results['documents'][0]):
                documents.append({
                    "content": doc,
                    "metadata": results['metadatas'][0][i] if results['metadatas'] else {},
                    "score": 1.0 - results['distances'][0][i] if 'distances' in results else 0.0
                })

            logger.info(f"Retrieved {len(documents)} documents from ChromaDB")
            return documents

        except Exception as e:
            logger.error(f"Error searching ChromaDB: {e}")
            return []

    async def _embed_text(self, text: str) -> List[float]:
        """Generate embedding for text"""
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer('all-MiniLM-L6-v2')
            return model.encode(text).tolist()
        except ImportError:
            logger.warning("sentence_transformers not installed, using OpenAI")
            return await self._generate_openai_embedding(text)

    async def _generate_openai_embedding(self, text: str) -> List[float]:
        """Fallback to OpenAI embeddings"""
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI()

            response = await client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )

            return response.data[0].embedding

        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return [0.0] * 384  # MiniLM dimension

    async def add_document(
        self,
        content: str,
        metadata: Dict[str, Any],
        collection: str = None
    ):
        """Add a document to the knowledge base"""
        if not self.collection:
            logger.warning("ChromaDB not connected, skipping document add")
            return

        try:
            # Generate embedding
            embedding = await self._embed_text(content)

            # Add to ChromaDB
            self.collection.add(
                documents=[content],
                embeddings=[embedding],
                metadatas=[metadata],
                ids=[metadata.get("id", f"doc_{datetime.now().timestamp()}")]
            )

            logger.info(f"Added document to ChromaDB")

        except Exception as e:
            logger.error(f"Error adding document: {e}")

    async def close(self):
        """Close ChromaDB connection"""
        if self.client:
            logger.info("ChromaDB connection closed")


class RAGEnabledAgent(ABC):
    """
    Base class for agents with RAG capabilities.

    This class provides automatic knowledge retrieval and storage,
    allowing agents to learn from previous interactions.

    Attributes:
        rag_config (RAGConfig): RAG configuration
        vector_db (VectorDatabase): Vector database instance
        max_tools (int): Maximum number of tools allowed
        tools (List): List of available tools
    """

    def __init__(
        self,
        rag_config: Optional[RAGConfig] = None,
        max_tools: int = 10,
        enable_rag: bool = True
    ):
        """
        Initialize RAG-enabled agent.

        Args:
            rag_config: RAG configuration (uses defaults if None)
            max_tools: Maximum number of tools (enforced!)
            enable_rag: Whether to enable RAG (default: True)
        """
        self.max_tools = max_tools
        self.tools = []
        self.enable_rag = enable_rag

        # Initialize RAG config
        if rag_config is None:
            rag_config = RAGConfig(enabled=enable_rag)

        self.rag_config = rag_config

        # Initialize vector database
        self.vector_db: Optional[VectorDatabase] = None
        if self.rag_config.enabled:
            self.vector_db = self._create_vector_db()

        # Performance metrics
        self.rag_queries_total = 0
        self.rag_queries_successful = 0
        self.knowledge_items_stored = 0

    def _create_vector_db(self) -> Optional[VectorDatabase]:
        """Create vector database instance based on configuration"""
        db_type = self.rag_config.vector_db_type.lower()

        if db_type == "neo4j":
            return Neo4jVectorDB()
        elif db_type == "chroma":
            return ChromaVectorDB()
        else:
            logger.warning(f"Unsupported vector DB type: {db_type}. RAG will be disabled.")
            return None

    async def connect_vector_db(self):
        """Establish connection to vector database"""
        if self.vector_db:
            await self.vector_db.connect()

    async def close_vector_db(self):
        """Close vector database connection"""
        if self.vector_db:
            await self.vector_db.close()

    def add_tool(self, tool: Any) -> bool:
        """
        Add a tool to the agent.

        Args:
            tool: Tool to add (any object with name and description)

        Returns:
            True if tool added, False if limit exceeded

        Raises:
            Warning: If tool count exceeds max_tools
        """
        if len(self.tools) >= self.max_tools:
            warnings.warn(
                f"⚠️  Tool count ({len(self.tools)}) exceeds "
                f"recommended maximum ({self.max_tools}). "
                f"Consider splitting into specialized sub-agents.",
                UserWarning
            )
            return False

        self.tools.append(tool)
        logger.info(f"Tool added: {tool.name if hasattr(tool, 'name') else 'unnamed'}")
        return True

    async def retrieve_knowledge(
        self,
        query: str,
        top_k: Optional[int] = None
    ) -> KnowledgeRetrievalResult:
        """
        Retrieve relevant knowledge from vector database.

        Args:
            query: Query string
            top_k: Number of results (uses config default if None)

        Returns:
            KnowledgeRetrievalResult with retrieved documents
        """
        if not self.rag_config.enabled or not self.vector_db:
            logger.info("RAG disabled or vector DB not connected")
            return KnowledgeRetrievalResult(
                query=query,
                documents=[],
                total_retrieved=0,
                retrieval_time=0.0,
                vector_db_used="none"
            )

        import time
        start_time = time.time()

        try:
            top_k = top_k or self.rag_config.top_k

            documents = await self.vector_db.search(
                query=query,
                top_k=top_k
            )

            retrieval_time = time.time() - start_time
            self.rag_queries_total += 1
            self.rag_queries_successful += 1

            logger.info(
                f"Retrieved {len(documents)} documents in {retrieval_time:.2f}s "
                f"for query: {query[:50]}..."
            )

            return KnowledgeRetrievalResult(
                query=query,
                documents=documents,
                total_retrieved=len(documents),
                retrieval_time=retrieval_time,
                vector_db_used=self.rag_config.vector_db_type
            )

        except Exception as e:
            logger.error(f"Error retrieving knowledge: {e}")
            self.rag_queries_total += 1

            return KnowledgeRetrievalResult(
                query=query,
                documents=[],
                total_retrieved=0,
                retrieval_time=time.time() - start_time,
                vector_db_used=self.rag_config.vector_db_type
            )

    async def store_knowledge(
        self,
        content: str,
        metadata: Dict[str, Any]
    ):
        """
        Store knowledge in vector database.

        Args:
            content: Content to store
            metadata: Metadata about the content
        """
        if not self.rag_config.enabled or not self.vector_db:
            logger.info("RAG disabled or vector DB not connected")
            return

        try:
            await self.vector_db.add_document(
                content=content,
                metadata=metadata
            )

            self.knowledge_items_stored += 1
            logger.info(f"Stored knowledge item (total: {self.knowledge_items_stored})")

        except Exception as e:
            logger.error(f"Error storing knowledge: {e}")

    @abstractmethod
    async def execute(
        self,
        task: str,
        context: Optional[Dict[str, Any]] = None,
        use_knowledge: bool = True
    ) -> Any:
        """
        Execute agent task with optional knowledge retrieval.

        Args:
            task: Task description
            context: Additional context
            use_knowledge: Whether to retrieve relevant knowledge

        Returns:
            Task execution result
        """
        pass

    def get_system_prompt(self) -> str:
        """
        Get system prompt for the agent.

        Returns:
            System prompt string
        """
        return "You are a helpful AI assistant."

    def get_tools(self) -> List[Any]:
        """
        Get list of available tools.

        Returns:
            List of tools
        """
        return self.tools

    def get_metrics(self) -> Dict[str, Any]:
        """
        Get agent performance metrics.

        Returns:
            Dictionary with metrics
        """
        return {
            "tool_count": len(self.tools),
            "max_tools": self.max_tools,
            "rag_enabled": self.rag_config.enabled,
            "rag_queries_total": self.rag_queries_total,
            "rag_queries_successful": self.rag_queries_successful,
            "rag_success_rate": (
                self.rag_queries_successful / self.rag_queries_total
                if self.rag_queries_total > 0 else 0
            ),
            "knowledge_items_stored": self.knowledge_items_stored,
            "vector_db_type": self.rag_config.vector_db_type if self.rag_config.enabled else "none"
        }
